import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { SecurityModule } from 'src/shared/security/security.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  imports: [UserModule, SecurityModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
