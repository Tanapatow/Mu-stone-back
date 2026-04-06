import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto } from 'src/user/dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';
import { UserWithoutPassword } from 'src/user/types/user.type';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';
import { ForgotPasswordDto, ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ResponseMessage('Account created successfully')
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.authService.register(createUserDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  async getCurrentUser(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserWithoutPassword> {
    return this.authService.getCurrentUser(user.sub);
  }

  @Public()
  @ResponseMessage('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลเรียบร้อยแล้ว')
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK) // คืนค่า 200 เพราะเป็นการประมวลผลสำเร็จ (ไม่ใช่การสร้าง Data ใหม่แบบ 201)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google/login')
  async googleLogin(@Body('token') token: string) {
    const googleUser = await this.authService.authenticateGoogleToken(token);

    // 2. จัดการ Database และออก Access Token ของเราเอง
    return this.authService.validateOAuthLogin(googleUser);
  }
}
