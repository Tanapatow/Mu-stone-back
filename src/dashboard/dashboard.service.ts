import { Injectable } from '@nestjs/common';
import { OrderStatus } from 'src/database/generated/prisma/enums';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  // ==========================================
  // 📊 1. API ดึงข้อมูลสรุป 4 กล่องบนสุด
  // ==========================================
  async getDashboardOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. ยอดขายวันนี้ (Revenue)
    const salesToday = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED] },
        createdAt: { gte: today },
      },
    });

    // 2. สินค้าหมดสต็อก (Out of Stock)
    const outOfStockCount = await this.prisma.product.count({
      where: { stock: { lte: 0 }, isActive: true },
    });

    // 3. ทราฟฟิกคนดูดวงวันนี้ (Fortune Traffic)
    const fortuneTrafficToday = await this.prisma.fortuneLog.count({
      where: { createdAt: { gte: today } },
    });

    // 4. Mutelu Conversion (สมมติ: คำนวณจาก ออเดอร์วันนี้ / คนดูดวงวันนี้)
    // *สามารถปรับ Logic ให้แม่นยำขึ้นได้ตามต้องการ
    const paidOrdersToday = await this.prisma.order.count({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED] },
        createdAt: { gte: today },
      },
    });

    const conversionRate =
      fortuneTrafficToday > 0
        ? ((paidOrdersToday / fortuneTrafficToday) * 100).toFixed(1)
        : 0;

    return {
      revenueToday: Number(salesToday._sum.totalAmount || 0),
      outOfStockCount,
      fortuneTrafficToday,
      conversionRate: Number(conversionRate),
      totalPurchases: paidOrdersToday,
    };
  }

  // ==========================================
  // 📈 2. API ดึงกราฟยอดขายย้อนหลัง 7 วัน
  // ==========================================
  async getSalesTrend(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // ดึงออเดอร์ทั้งหมดใน 7 วันที่ผ่านมา
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED] },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, totalAmount: true },
    });

    // จัดกลุ่มข้อมูลตามวันที่ (Grouping in JS)
    const salesByDate: Record<string, number> = {};

    // สร้าง Template วันที่ว่างๆ ไว้ก่อน (เผื่อวันไหนขายไม่ได้ จะได้โชว์เป็น 0)
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      salesByDate[dateString] = 0;
    }

    // บวกยอดขายเข้าไปในแต่ละวัน
    orders.forEach((order) => {
      const dateString = order.createdAt.toISOString().split('T')[0];
      if (salesByDate[dateString] !== undefined) {
        salesByDate[dateString] += Number(order.totalAmount);
      }
    });

    // แปลง Object กลับเป็น Array เพื่อให้หน้าบ้านเอาไปวาดกราฟง่ายๆ
    return Object.keys(salesByDate).map((date) => ({
      date,
      totalRevenue: salesByDate[date],
    }));
  }

  // ==========================================
  // 🏆 3. API ดึงสินค้าขายดี 5 อันดับแรก
  // ==========================================
  async getTopSellers(limit: number = 5) {
    // ใช้ Prisma GroupBy เพื่อหาว่าสินค้าชิ้นไหนถูกสั่งซื้อเยอะสุด
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    // ดึงข้อมูลชื่อสินค้ามาประกอบ
    const productIds = topItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        stock: true,
        stoneType: true,
        images: { where: { isMain: true } },
      },
    });

    // แมปข้อมูลให้สวยงาม
    return topItems.map((item) => {
      const productInfo = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: productInfo?.name || 'Unknown Product',
        stoneType: productInfo?.stoneType,
        stockLeft: productInfo?.stock,
        totalSold: item._sum.quantity || 0,
        imageUrl: productInfo?.images[0].url || null,
      };
    });
  }

  async getWeeklySalesTrend(weeks: number = 4) {
    // 1. หาวันที่เริ่มต้น (ย้อนกลับไป x สัปดาห์)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7 + 1);
    startDate.setHours(0, 0, 0, 0);

    // 2. ดึงออเดอร์ทั้งหมดในช่วงเวลาที่กำหนด
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED] },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, totalAmount: true },
    });

    // 3. เตรียม Object สำหรับเก็บข้อมูลรายสัปดาห์
    const salesByWeek: Record<string, { label: string; totalRevenue: number }> =
      {};

    // 4. สร้าง Template สัปดาห์ว่างๆ ไว้ก่อน (เผื่อสัปดาห์ไหนขายไม่ได้ จะได้โชว์ 0)
    // เราจะนับถอยหลัง เช่น สัปดาห์ที่ 4 (ล่าสุด), สัปดาห์ที่ 3, ...
    for (let i = weeks; i >= 1; i--) {
      const weekLabel = `สัปดาห์ที่ ${i}`; // จะแสดงเป็น "สัปดาห์ที่ 4", "สัปดาห์ที่ 3"
      salesByWeek[i] = { label: weekLabel, totalRevenue: 0 };
    }

    // 5. จับคู่ออเดอร์ว่าอยู่ใน "สัปดาห์ที่เท่าไหร่" (นับจากปัจจุบันย้อนกลับไป)
    const currentDate = new Date();
    orders.forEach((order) => {
      // คำนวณว่าออเดอร์นี้ผ่านมาแล้วกี่วัน
      const diffTime = Math.abs(
        currentDate.getTime() - order.createdAt.getTime(),
      );
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // แปลงจำนวนวัน เป็น "สัปดาห์ที่" (1-4)
      // หาร 7 แล้วปัดขึ้น เช่น ผ่านมา 5 วัน = สัปดาห์ที่ 1 (สัปดาห์ล่าสุด)
      // ผ่านมา 10 วัน = สัปดาห์ที่ 2
      const weekIndex = Math.ceil(diffDays / 7);

      // ถ้าย้อนกลับไปไม่เกินจำนวนสัปดาห์ที่เราตั้งไว้ (เช่น ไม่เกิน 4 สัปดาห์)
      if (weekIndex <= weeks && weekIndex >= 1) {
        salesByWeek[weekIndex].totalRevenue += Number(order.totalAmount);
      }
    });

    // 6. แปลง Object เป็น Array แล้วกลับด้าน (Reverse)
    // เพื่อให้กราฟเรียงจาก สัปดาห์เก่าสุด (สัปดาห์ 4) -> สัปดาห์ใหม่สุด (สัปดาห์ 1)
    const result = Object.keys(salesByWeek)
      .map((key) => salesByWeek[key])
      .reverse();

    return result;
  }
}
