import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TypedConfigService } from 'src/config/typed-config.service';
import {
  Order,
  OrderItem,
  Product,
} from 'src/database/generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { OrderGateway } from 'src/socket/order.gateway';
import Stripe from 'stripe';

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
  })[];
};

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly typedConfigService: TypedConfigService,
    private readonly prisma: PrismaService,
    private readonly orderGateway: OrderGateway,
  ) {
    const secretKey = this.typedConfigService.get('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  // ===========================================================================
  //  สร้างหน้าต่างชำระเงิน (Checkout Session)
  // ===========================================================================

  // 👇 3. เปลี่ยนจาก any เป็น OrderWithItems
  async createCheckoutSession(order: OrderWithItems) {
    const frontUrl = this.typedConfigService.get('FRONTEND_URL');

    try {
      const lineItems = order.items.map((item) => ({
        price_data: {
          currency: 'thb',
          product_data: {
            name: item.product.name,
            description: item.product.description || 'สินค้าจากร้านค้าของเรา',
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      }));

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card', 'promptpay'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${frontUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontUrl}/cancel`,
        metadata: {
          orderId: order.id,
        },
      });

      return session;
    } catch (error) {
      console.error('[StripeService.createCheckoutSession] Error:', error);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถเชื่อมต่อระบบชำระเงินได้ในขณะนี้',
        code: 'STRIPE_SESSION_FAILED',
      });
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.typedConfigService.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;
    if (!signature) {
      throw new BadRequestException({
        message: 'Missing stripe-signature header',
      });
    }

    try {
      // 1. ถอดรหัสและยืนยันตัวตนว่าเป็น Stripe ตัวจริงส่งมา!
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Error';
      console.error('⚠️ Webhook signature verification failed.', errorMessage);
      throw new BadRequestException(`Webhook Error: ${errorMessage}`);
    }
    console.log('📦 ได้รับ Event Type:', event.type); // ดูว่าใช่ checkout.session.completed ไหม
    // 2. เช็คว่าเป็น Event "จ่ายเงินสำเร็จ" ใช่หรือไม่?
    if (event.type === 'checkout.session.completed') {
      // ดึงข้อมูล Session ออกมาและกำหนด Type ให้ชัดเจน
      const session = event.data.object;
      console.log('🆔 Metadata ที่ได้รับ:', session.metadata); // 👈 เช็คว่ามี orderId ไหม
      // 3. ดึง orderId ที่เราแอบซ่อนไว้ใน metadata
      const orderId = session.metadata?.orderId;

      if (orderId) {
        // 4. สั่งอัปเดตสถานะบิลใน Database ให้เป็น PAID !! 💸
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        });
        console.log(
          `✅ [Webhook] บิล ${orderId} ชำระเงินสำเร็จและอัปเดตสถานะแล้ว!`,
        );

        this.orderGateway.notifyOrderStatusUpdate(orderId, 'PAID');
      }
    }

    return { received: true };
  }
}
