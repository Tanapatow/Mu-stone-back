import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SecurityModule } from 'src/shared/security/security.module';
import { UserController } from './user.controller';

@Module({
  imports: [SecurityModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
