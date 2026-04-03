import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { OrderService } from './order.service';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';
import { GetAllOrderDto } from './dto/get-all-order.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { OrderStatus } from 'src/database/generated/prisma/enums';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ResponseMessage('สร้างคำสั่งซื้อและเตรียมหน้าชำระเงินสำเร็จ')
  @Roles('USER')
  @Post()
  async checkout(@CurrentUser('sub') userId: string) {
    return await this.orderService.checkout(userId);
  }

  @Roles('ADMIN')
  @Get('admin/all')
  async getAllOrder(@Query() getAllOrderDto: GetAllOrderDto) {
    return await this.orderService.getAllOrders(getAllOrderDto);
  }

  @Roles('ADMIN')
  @Patch('admin/:id/status')
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: OrderStatus,
  ) {
    return await this.orderService.updateOrderStatus(id, status);
  }

  @Roles('USER')
  @Get('me')
  async getMyOrder(@CurrentUser('sub') userId: string) {
    return this.orderService.getMyOrders(userId);
  }

  @Get(':id')
  async getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.getOrderById(id);
  }
}
