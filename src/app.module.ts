import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SecurityModule } from './shared/security/security.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RoleGuard } from './auth/guards/role.guard';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    SecurityModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}
