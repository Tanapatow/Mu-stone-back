import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { StripeModule } from 'src/stripe/stripe.module';
import { OrderGateway } from './order.gateway';

@Module({
  imports: [StripeModule],
  controllers: [OrderController],
  providers: [OrderService, OrderGateway],
  exports: [OrderGateway],
})
export class OrderModule {}
