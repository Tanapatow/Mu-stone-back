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
}
