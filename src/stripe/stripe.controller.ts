import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import type { RawBodyRequest } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Public()
  @Post('webhook')
  async webhook(
    @Headers('stripe-signature') signature: string, // 👈 รับลายเซ็นจาก Header
    @Req() req: RawBodyRequest<Request>, // 👈 รับข้อมูลแบบ Raw Body
  ) {
    // โยนลายเซ็น และ ก้อนข้อมูลดิบ (req.rawBody) ไปให้ Service จัดการ
    if (!req.rawBody) {
      throw new BadRequestException({
        message: 'Missing raw body in the request',
      });
    }
    return this.stripeService.handleWebhook(signature, req.rawBody);
  }
}
