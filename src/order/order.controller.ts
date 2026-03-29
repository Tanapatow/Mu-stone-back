import { Controller, Post } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async checkout(@CurrentUser('sub') userId: string) {
    return await this.orderService.checkout(userId);
  }
}
