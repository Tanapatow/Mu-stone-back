import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { CreateUserDto } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dtos/login.dto';
import { User } from 'src/database/generated/prisma/client';
import { AuthTokenService } from 'src/shared/security/services/auth-token.service';
import { UserWithoutPassword } from 'src/user/types/user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly authTokenService: AuthTokenService,
  ) {}

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
    });

    const { password, ...rest } = user;
    return { accessToken, user: rest };
  }

  async getCurrentUser(id: string): Promise<UserWithoutPassword> {
    return this.userService.findById(id);
  }
}
