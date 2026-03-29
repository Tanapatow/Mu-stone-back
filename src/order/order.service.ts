import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  //  Checkout: เปลี่ยนของในตะกร้าให้กลายเป็นใบสั่งซื้อ (Order)
  // ===========================================================================
  async checkout(userId: string) {
    try {
      // 1. ดึงข้อมูล User (เพื่อเอาที่อยู่) และดึง Cart (เพื่อเอาของในตะกร้า)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          address: true, // ดึงที่อยู่จัดส่งมาด้วย
          cart: {
            include: {
              items: {
                include: { product: true },
              },
            },
          },
        },
      });

      // 2. เช็คว่ามีที่อยู่จัดส่งหรือยัง? (บังคับว่าต้องมีถึงจะซื้อได้)
      if (!user?.address) {
        throw new BadRequestException({
          message: 'โปรดเพิ่มที่อยู่สำหรับจัดส่งก่อนทำการสั่งซื้อ',
          code: 'ADDRESS_NOT_FOUND',
        });
      }

      const cart = user.cart;

      // 3. เช็คว่าตะกร้าว่างไหม
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException({
          message: 'ตะกร้าสินค้าว่างเปล่า ไม่สามารถสร้างคำสั่งซื้อได้',
          code: 'CART_IS_EMPTY',
        });
      }

      // 4. เช็คสต๊อกสินค้าทุกชิ้นอีกรอบ (เผื่อมีคนแย่งซื้อไปตอนกำลังตัดสินใจ)
      let totalAmount = 0;
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException({
            message: `ขออภัย สินค้า "${item.product.name}" มีสต๊อกไม่เพียงพอ (เหลือ ${item.product.stock} ชิ้น)`,
            code: 'INSUFFICIENT_STOCK',
          });
        }
        // คำนวณยอดรวมไปด้วยเลย
        totalAmount += Number(item.product.price) * item.quantity;
      }

      // 5. ปั้น Snapshot ที่อยู่จัดส่ง (เก็บเป็น String แข็งๆ ไว้ในบิลเลย)
      const addr = user.address;
      const addressSnapshot = `ผู้รับ: ${addr.receiverName} โทร: ${addr.phone}\nที่อยู่: ${addr.addressLine1} ต.${addr.subDistrict} อ.${addr.district} จ.${addr.province} ${addr.postalCode}`;

      // =======================================================================
      // 🚨 เริ่ม TRANSACTION: ทำทุกอย่างพร้อมกัน ถ้าพังตรงไหน ให้ยกเลิกทั้งหมด 🚨
      // =======================================================================
      const order = await this.prisma.$transaction(async (prisma) => {
        // 6.1 สร้างหัวบิล (Order)
        const newOrder = await prisma.order.create({
          data: {
            userId: userId,
            totalAmount: totalAmount,
            status: 'PENDING', // รอจ่ายเงิน
            shippingAddressSnapshot: addressSnapshot,
          },
        });

        // 6.2 เอาของจากตะกร้า มาสร้างเป็นรายการสั่งซื้อ (OrderItem) และล็อกราคา
        const orderItemsData = cart.items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price, // ล็อกราคา ณ วันที่ซื้อ
        }));
        await prisma.orderItem.createMany({ data: orderItemsData });

        // 6.3 ตัดสต๊อกสินค้า (Product)
        for (const item of cart.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }, // ลดจำนวนสต๊อกลง
          });
        }

        // 6.4 เคลียร์ตะกร้าทิ้ง (ลบ CartItem ของ User คนนี้)
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        // คืนค่าบิลที่สร้างเสร็จกลับไป
        return newOrder;
      });

      // 7. ดึงข้อมูลบิลที่สมบูรณ์แบบส่งกลับไปให้ Frontend
      return await this.prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'ระบบสั่งซื้อขัดข้อง โปรดลองใหม่อีกครั้ง',
        code: 'CHECKOUT_FAILED',
      });
    }
  }
}
