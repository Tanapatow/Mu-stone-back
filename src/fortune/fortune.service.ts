import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { GenaiService } from 'src/shared/genai/genai.service';

@Injectable()
export class FortuneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly genaiService: GenaiService,
  ) {}

  async drawAndPredict(userId: string) {
    try {
      const allCards = await this.prisma.tarotCard.findMany({
        select: { id: true },
      });

      if (allCards.length < 3) {
        throw new InternalServerErrorException({
          message: 'ข้อมูลไพ่ในระบบไม่เพียงพอ (ต้องมีอย่างน้อย 3 ใบ)',
          code: 'INSUFFICIENT_CARDS',
        });
      }

      const shuffled = allCards.sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, 3).map((card) => card.id);

      const [drawnCards, activeProducts] = await Promise.all([
        this.prisma.tarotCard.findMany({ where: { id: { in: selectedIds } } }),
        this.prisma.product.findMany({
          where: { isActive: true },
          select: { id: true, name: true, stoneType: true, benefit: true },
        }),
      ]);

      const cardInfo = drawnCards
        .map(
          (c, index) => `ใบที่ ${index + 1}: ${c.nameThai} (${c.baseMeaning})`,
        )
        .join('\n');

      const productInfo = activeProducts
        .map(
          (p) =>
            `- ID: ${p.id} | ${p.name} (หิน ${p.stoneType}): สรรพคุณ ${p.benefit}`,
        )
        .join('\n');

      const prompt = `
        คุณคือ หมอดูไพ่ทาโรต์มืออาชีพที่มีจิตวิทยาดี ใช้ภาษาไทยสละสลวย อบอุ่น เป็นกันเอง และชำนาญเรื่องการใช้หินมงคลเสริมดวง
        
        ลูกค้าจับไพ่ได้ 3 ใบ เพื่อดูดวง "ภาพรวม" ดังนี้:
        ${cardInfo}

        หน้าที่ของคุณ:
        1. ทำนายดวงชะตาภาพรวมจากไพ่ 3 ใบนี้แบบร้อยเรียงกันเป็นเรื่องราว อ่านแล้วลื่นไหล ให้กำลังใจ ไม่ต้องแยกอดีต ปัจจุบัน อนาคต
        2. แนะนำ "หินมงคล" จากรายการสินค้าที่มีในร้าน เพื่อเสริมดวง 3 ด้าน (การงาน, การเงิน, ความรัก) ด้านละ 1 ชิ้น โดยเลือกให้ตรงกับดวงชะตาที่เพิ่งทำนายไป (พูดป้ายยาเนียนๆ ท้ายคำทำนาย)

        รายการสินค้าที่มีในร้าน (เลือกจากรายชื่อนี้เท่านั้น ห้ามแต่งขึ้นมาเองเด็ดขาด):
        ${productInfo || 'ไม่มีสินค้าในร้านขณะนี้ (ถ้าไม่มี ให้ข้ามการแนะนำสินค้าไป)'}

        🛑 กฎเหล็กสำหรับการตอบกลับ:
        คุณต้องตอบกลับมาเป็นข้อมูลรูปแบบ JSON (Raw Object) เท่านั้น! ห้ามมีคำอธิบายนำหน้า ห้ามมี \`\`\`json ครอบ ห้ามมีข้อความอื่นปน โครงสร้างต้องเป็นดังนี้เป๊ะๆ:
        {
          "predictionText": "ขึ้นด้วยจากการทำนาย ไม่ต้องแทนตัวเองว่าเป็นใคร ใส่ข้อความคำทำนายทั้งหมดของคุณที่นี่ รวมถึงข้อความป้ายยาสินค้าด้วย จัดรูปแบบให้อ่านง่าย เว้นวรรคตอนให้สวยงาม ใช้ \\n ในการขึ้นบรรทัดใหม่",
          "recommendedProductIds": ["ไอดีสินค้าชิ้นที่_1", "ไอดีสินค้าชิ้นที่_2", "ไอดีสินค้าชิ้นที่_3"]
        }
      `;

      const rawAiResponse = await this.genaiService.generateText(prompt);

      const cleanJsonString = rawAiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      let parsedAiData;
      try {
        parsedAiData = JSON.parse(cleanJsonString) as {
          predictionText: string;
          recommendedProductIds: string[];
        };
      } catch {
        console.error(
          '[FortuneService] Failed to parse JSON. Raw AI Output:',
          cleanJsonString,
        );
        throw new InternalServerErrorException({
          message: 'ระบบ AI ตอบกลับมาผิดรูปแบบ โปรดลองใหม่อีกครั้ง',
          code: 'AI_PARSE_ERROR',
        });
      }

      const uniqueProductIds = [...new Set(parsedAiData.recommendedProductIds)];

      const validProductIds = uniqueProductIds.filter((id) =>
        activeProducts.some((product) => product.id === id),
      );

      const fortuneLog = await this.prisma.fortuneLog.create({
        data: {
          userId: userId,
          topic: 'General',
          predictionText: parsedAiData.predictionText,
          cards: {
            connect: drawnCards.map((card) => ({ id: card.id })),
          },
          recommendedProducts: {
            connect: validProductIds.map((productId: string) => ({
              id: productId,
            })),
          },
        },
        include: {
          cards: true,
          recommendedProducts: true,
        },
      });

      return fortuneLog;
    } catch (error) {
      console.error('[FortuneService.drawAndPredict] Error:', error);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'ระบบแม่หมอขัดข้อง ไม่สามารถทำนายดวงได้ในขณะนี้',
        code: 'FORTUNE_PREDICTION_FAILED',
      });
    }
  }
}
