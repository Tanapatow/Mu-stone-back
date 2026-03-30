import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TypedConfigService } from 'src/config/typed-config.service';
import {
  Order,
  OrderItem,
  Product,
} from 'src/database/generated/prisma/client';
import Stripe from 'stripe';

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
  })[];
};

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly typedConfigService: TypedConfigService) {
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
}
