import { Controller, Post } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { OrderService } from './order.service';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ResponseMessage('สร้างคำสั่งซื้อและเตรียมหน้าชำระเงินสำเร็จ')
  @Post()
  async checkout(@CurrentUser('sub') userId: string) {
    return await this.orderService.checkout(userId);
  }
}
