import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    try {
      const { productId, quantity = 1 } = addToCartDto;

      // 1.1 เช็คว่าสินค้ามีอยู่จริงและสต๊อกพอไหม
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || !product.isActive) {
        throw new NotFoundException({
          message: 'ไม่พบสินค้า หรือสินค้านี้ถูกระงับการขายแล้ว',
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      if (product.stock < quantity) {
        throw new BadRequestException({
          message: 'ขออภัย สินค้าในสต๊อกมีไม่เพียงพอ',
          code: 'INSUFFICIENT_STOCK',
        });
      }

      // 1.2 หาตะกร้าของ User คนนี้ ถ้าไม่มีให้สร้างใหม่
      let cart = await this.prisma.cart.findUnique({
        where: { userId: userId },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId: userId },
        });
      }

      // 1.3 เช็คว่าสินค้านี้อยู่ในตะกร้าแล้วหรือยัง
      const existingCartItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: productId,
        },
      });

      if (existingCartItem) {
        // ถ้ารูปแบบเดิมมีอยู่แล้ว -> อัปเดตบวกจำนวนเพิ่ม
        const newQuantity = existingCartItem.quantity + quantity;

        // เช็คสต๊อกอีกรอบว่าบวกแล้วเกินสต๊อกไหม
        if (product.stock < newQuantity) {
          throw new BadRequestException({
            message: `ขออภัย เพิ่มไม่ได้แล้ว (สต๊อกเหลือ ${product.stock} ชิ้น)`,
            code: 'EXCEED_STOCK_LIMIT',
          });
        }

        await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        // ถ้ายังไม่มีสินค้านี้ในตะกร้า -> สร้างรายการใหม่
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productId,
            quantity: quantity,
          },
        });
      }

      // 1.4 ดึงข้อมูลตะกร้าที่อัปเดตล่าสุดกลับไปให้ดู
      return await this.getCart(userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'เกิดข้อผิดพลาดภายในระบบ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้',
        code: 'ADD_TO_CART_FAILED',
      });
    }
  }

  //GetCart/////

  async getCart(userId: string) {
    try {
      // ดึงตะกร้าของ User คนนี้ พร้อมกับข้อมูลสินค้าและรูปหน้าปก
      const cart = await this.prisma.cart.findUnique({
        where: { userId: userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isMain: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      // ถ้าค้นแล้วไม่เจอ (User ยังไม่เคยหยิบของใส่ตะกร้าเลย)
      if (!cart) {
        return {
          message: 'ตะกร้าสินค้ายังว่างเปล่า',
          items: [],
          totalPrice: 0,
        };
      }

      // คำนวณราคารวมทั้งหมดในตะกร้า (เอา ราคา * จำนวน ของแต่ละชิ้นมาบวกกัน)
      const totalPrice = cart.items.reduce((sum, item) => {
        const itemPrice = Number(item.product.price) * item.quantity;
        return sum + itemPrice;
      }, 0);

      // ส่งข้อมูลตะกร้ากลับไป พร้อมกับแนบยอดรวม (totalPrice) ไปด้วย
      return {
        ...cart,
        totalPrice: totalPrice,
      };
    } catch (error) {
      console.error(`[CartService.getCart] Error for user ${userId}:`, error);
      throw new InternalServerErrorException({
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้าสินค้า',
        code: 'GET_CART_FAILED',
      });
    }
  }
}
