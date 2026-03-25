import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SecurityModule } from 'src/shared/security/security.module';

@Module({
  imports: [SecurityModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
