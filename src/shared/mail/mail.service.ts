import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { TypedConfigService } from 'src/config/typed-config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: TypedConfigService, // 🌟 ฉีด ConfigService เข้ามา
  ) {}

  async sendResetPasswordEmail(email: string, token: string) {
    try {
      console.log('sending email to:', email);
      console.log('from:', this.configService.get('MAIL_USER'));
      // 1. ดึงค่า URL หน้าบ้านแบบ Type-Safe
      const frontendUrl = this.configService.get('FRONTEND_URL');

      // 2. ประกอบร่างเป็นลิงก์สำหรับกดเปลี่ยนรหัส
      const url = `${frontendUrl}/reset-password?token=${token}`;

      // 3. สั่งส่งอีเมล
      await this.mailerService.sendMail({
        to: email,
        subject: '🔐 รีเซ็ตรหัสผ่าน - MU Store',
        template: './reset-password', // ชี้ไปที่ไฟล์ reset-password.hbs
        context: {
          email: email,
          url: url,
        },
      });

      this.logger.log(`✅ ส่งอีเมลรีเซ็ตรหัสผ่านไปยัง ${email} สำเร็จ!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ เกิดข้อผิดพลาดในการส่งอีเมลไปที่ ${email}:`,
        errorMessage,
      );
      // ในระบบจริง อาจจะ throw error หรือปล่อยผ่านเพื่อให้ระบบทำงานต่อก็ได้
      throw error;
    }
  }
}
