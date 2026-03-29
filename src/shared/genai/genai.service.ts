import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TypedConfigService } from 'src/config/typed-config.service';

@Injectable()
export class GenaiService {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly typedConfigService: TypedConfigService) {
    // 1. ตั้งค่าและ Initialize AI ด้วย Key จาก TypedConfigService (ทำครั้งเดียวตอนเริ่มรันแอป)
    const apiKey = this.typedConfigService.get('GEMINI_API_KEY');

    this.genAI = new GoogleGenerativeAI(apiKey);
    console.log('--- Checking API Key ---');
    console.log(
      apiKey ? 'Key exists (Length: ' + apiKey.length + ')' : 'Key is MISSING!',
    );
  }

  // 2. ฟังก์ชันเรียกใช้ AI (เหมือนฟังก์ชัน upload ของ Cloudinary)
  async generateText(prompt: string): Promise<string> {
    try {
      // ระบุรุ่นโมเดลที่จะใช้
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      // สั่งให้ AI ประมวลผลและรอรับคำตอบ
      const aiResponse = await model.generateContent(prompt);

      // ดึงเฉพาะข้อความตอบกลับส่งคืนไป
      return aiResponse.response.text();
    } catch (error) {
      console.error('[GenaiService.generateText] Error:', error);
      throw new InternalServerErrorException({
        message: 'ระบบ AI ขัดข้อง ไม่สามารถประมวลผลได้',
        code: 'GENAI_ERROR',
      });
    }
  }
}
