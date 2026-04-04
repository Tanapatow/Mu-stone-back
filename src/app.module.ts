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
import { ProductModule } from './product/product.module';
import { UploadModule } from './shared/upload/upload.module';
import { CartModule } from './cart/cart.module';
import { FortuneModule } from './fortune/fortune.module';
import { GenaiModule } from './shared/genai/genai.module';
import { OrderModule } from './order/order.module';
import { StripeModule } from './stripe/stripe.module';
import { SocketModule } from './socket/socket.module';
import { MailModule } from './shared/mail/mail.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    SecurityModule,
    ProductModule,
    UploadModule,
    CartModule,
    FortuneModule,
    GenaiModule,
    OrderModule,
    StripeModule,
    SocketModule,
    MailModule,
    ChatModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}
