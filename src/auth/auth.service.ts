import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { CreateUserDto } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dtos/login.dto';
import { User } from 'src/database/generated/prisma/client';
import { AuthTokenService } from 'src/shared/security/services/auth-token.service';
import { UserWithoutPassword } from 'src/user/types/user.type';
import { PrismaService } from 'src/database/prisma.service';
import * as crypto from 'crypto';
import { MailService } from 'src/shared/mail/mail.service';
import { OAuth2Client } from 'google-auth-library';
import { TypedConfigService } from 'src/config/typed-config.service';
import { GooglePayload } from './types/google-payload.type';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly authTokenService: AuthTokenService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly typedConfigService: TypedConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.typedConfigService.get('GOOGLE_CLIENT_ID'),
    );
  }

  async register(createUserDto: CreateUserDto): Promise<void> {
    await this.userService.create(createUserDto);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user)
      throw new UnauthorizedException({
        message: 'The provided email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });

    if (!user.password) {
      throw new UnauthorizedException({
        message: 'อีเมลนี้ถูกผูกไว้กับบัญชี Google กรุณาเข้าสู่ระบบด้วย Google',
        code: 'USE_SOCIAL_LOGIN',
      });
    }
    const isMatch = await this.bcryptService.compare(
      loginDto.password,
      user.password,
    );
    if (!isMatch)
      throw new UnauthorizedException({
        message: 'The provided email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });

    // 3. Gen access token
    const accessToken = await this.authTokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...rest } = user;
    return { accessToken, user: rest };
  }

  async getCurrentUser(id: string): Promise<UserWithoutPassword> {
    return this.userService.findById(id);
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        return {
          message:
            'หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้วครับ',
        };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000);

      await this.prisma.passwordReset.create({
        data: {
          token: token,
          expiresAt: expiresAt,
          userId: user.id,
        },
      });

      await this.mailService.sendResetPasswordEmail(user.email, token);

      return;
    } catch (error) {
      // 🌟 ดักจับ Error และโยน 500 ออกไปแบบสวยงาม
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[forgotPassword] Error: ${errorMessage}`);

      throw new InternalServerErrorException({
        message:
          'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน กรุณาลองใหม่อีกครั้ง',
        code: 'SEND_MAIL_ERROR',
      });
    }
  }

  // ==========================================
  // 🔐 2. ตั้งรหัสผ่านใหม่
  // ==========================================
  async resetPassword(token: string, newPassword: string) {
    try {
      const resetRecord = await this.prisma.passwordReset.findFirst({
        where: {
          token: token,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      // 🌟 โยน 400 BadRequest ถ้า Token ไม่ถูกต้อง (อันนี้เป็น Business Logic error)
      if (!resetRecord) {
        throw new BadRequestException({
          message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หมดอายุ หรือถูกใช้งานไปแล้ว',
          code: 'INVALID_OR_EXPIRED_TOKEN',
        });
      }

      const hashedPassword = await this.bcryptService.hash(newPassword);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: resetRecord.userId },
          data: { password: hashedPassword },
        }),
        this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { isUsed: true },
        }),
      ]);

      return {
        message:
          'เปลี่ยนรหัสผ่านใหม่สำเร็จ! คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // 🌟 แต่ถ้าเป็น Error จากระบบ (เช่น DB ล่ม) ค่อยดักจับไว้ตรงนี้
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[resetPassword] Error: ${errorMessage}`);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
        code: 'RESET_PASSWORD_DATABASE_ERROR',
      });
    }
  }

  async authenticateGoogleToken(idToken: string): Promise<GooglePayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: idToken,
        audience: this.typedConfigService.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException({
          message: 'โครงสร้างข้อมูล Google Token ไม่ถูกต้อง',
          code: 'GOOGLE_AUTH_INVALID_PAYLOAD',
        });
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
      };
    } catch (error) {
      this.logger.error(
        `[authenticateGoogleToken] Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException({
        message: 'การยืนยันตัวตนกับ Google ล้มเหลว',
        code: 'GOOGLE_AUTH_FAILED',
      });
    }
  }

  // ==========================================
  // 🤝 2. จัดการ Login/Register (OAuth)
  // ==========================================
  async validateOAuthLogin(googleUser: GooglePayload) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          googleId: googleUser.googleId,
          provider: 'GOOGLE',
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { email: googleUser.email },
        data: {
          googleId: googleUser.googleId,
          provider: 'GOOGLE',
        },
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    // เช็คใน AuthTokenService ของคุณว่า sign เป็น async หรือเปล่า ถ้าใช่ให้เติม await นะครับ
    const token = await this.authTokenService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
      },
    };
  }
}
