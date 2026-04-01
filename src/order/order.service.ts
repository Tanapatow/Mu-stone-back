import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';
import { GetAllOrderDto } from './dto/get-all-order.dto';
import { Prisma } from 'src/database/generated/prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  //  Checkout: เปลี่ยนของในตะกร้าให้กลายเป็นใบสั่งซื้อ (Order)

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
      const completeOrder = await this.prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // 8. โยนข้อมูลบิลไปให้ StripeService เพื่อสร้างหน้าต่างรูดบัตร
      const stripeSession =
        await this.stripeService.createCheckoutSession(completeOrder);

      // 9. เอา Session ID ที่ Stripe คืนมา กลับไปเซฟอัปเดตลงใน Database ของบิลใบนี้
      await this.prisma.order.update({
        where: { id: completeOrder.id },
        data: { stripeSessionId: stripeSession.id },
      });

      // 10. ส่งผลลัพธ์กลับไปให้ Frontend (เปลี่ยนจากการคืนค่า Order ทั้งก้อน มาเป็นโครงสร้างที่ใช้งานง่ายขึ้น)
      return {
        orderId: completeOrder.id,
        paymentUrl: stripeSession.url, // 👈 Frontend จะเอาลิงก์นี้ไปให้ลูกค้ากดเพื่อจ่ายเงิน
      };
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

  async getAllOrders(getAllOrderDto: GetAllOrderDto) {
    try {
      const { limit = 10, page = 1, status } = getAllOrderDto;
      // ใช้ Prisma.OrderWhereInput เพื่อความปลอดภัยของ Type
      const whereCondition: Prisma.OrderWhereInput = status
        ? { status: status }
        : {};

      const [totalItems, orders] = await Promise.all([
        this.prisma.order.count({ where: whereCondition }),
        this.prisma.order.findMany({
          where: whereCondition,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: { items: true },
            },
          },
        }),
      ]);

      const lastPage = Math.ceil(totalItems / limit);

      return {
        orders,
        meta: {
          totalItems,
          itemCount: orders.length,
          itemsPerPage: limit,
          totalPages: lastPage,
          currentPage: page,
          hasNextPage: page < lastPage,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('[OrderService.getAllOrders] Error:', error);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อทั้งหมดได้',
        code: 'FETCH_ALL_ORDERS_FAILED',
      });
    }
  }

  // ========================================================================
  // 🔍 2. ดึงรายละเอียดคำสั่งซื้อตาม ID (เจาะลึกราย Item)
  // ========================================================================
  async getOrderById(id: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: {
                    where: { isMain: true },
                    select: { url: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException({
          message: `ไม่พบคำสั่งซื้อรหัส ${id}`,
          code: 'ORDER_NOT_FOUND',
        });
      }

      // ✨ ปรับโครงสร้างข้อมูล (Transform) ให้รูปภาพใช้ง่ายขึ้นเหมือนใน getMyOrders
      const formattedItems = order.items.map((item) => {
        const { product, ...itemInfo } = item;
        return {
          ...itemInfo,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.images?.[0]?.url || null,
          },
        };
      });

      return {
        ...order,
        items: formattedItems,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      console.error('[OrderService.getOrderById] Error:', error);
      throw new InternalServerErrorException({
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
        code: 'FETCH_ORDER_BY_ID_FAILED',
      });
    }
  }

  async getMyOrders(userId: string) {
    try {
      const orders = await this.prisma.order.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' }, // บิลล่าสุดอยู่บนสุด
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  // ✨ ดึงรูปหน้าปก (isMain: true) มาแค่รูปเดียว
                  images: {
                    where: { isMain: true },
                    select: { url: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      // 💄 การ Transform ข้อมูล (แต่งตัวให้หน้าบ้านใช้ง่าย)
      return orders.map((order) => ({
        ...order,
        items: order.items.map((item) => {
          // ดึง URL ออกมาจาก Array images (ถ้าไม่มีให้เป็น null)
          const mainImageUrl = item.product.images?.[0]?.url || null;

          // ลบฟิลด์ images (ที่เป็น array) ออกไป ไม่ให้รก
          const { images, ...productInfo } = item.product;

          return {
            ...item,
            product: {
              ...productInfo,
              imageUrl: mainImageUrl, // ส่งเป็น String เส้นเดียวไปเลย
            },
          };
        }),
      }));
    } catch (error) {
      console.error('[OrderService.getMyOrders] Error:', error);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้',
        code: 'FETCH_MY_ORDERS_FAILED',
      });
    }
  }
}
