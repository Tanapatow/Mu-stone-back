import { Module } from '@nestjs/common';
import { BcryptService } from './services/bcrypt.service';
import { AuthTokenService } from './services/auth-token.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [BcryptService, AuthTokenService],
  exports: [BcryptService, AuthTokenService],
})
export class SecurityModule {}
