import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypedConfigService } from 'src/config/typed-config.service';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      // 🌟 2. ฉีด TypedConfigService เข้ามาแทน ConfigService ปกติ
      inject: [TypedConfigService],

      // 🌟 3. รับค่าเข้ามาใช้งานใน Factory
      useFactory: (configService: TypedConfigService) => ({
        transport: {
          // 🎯 4. พิมพ์ configService.get() ปุ๊บ Auto-complete ชื่อตัวแปร .env จะเด้งขึ้นมาเลย! (แถมไม่ต้องใส่ <string> แล้ว)
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          secure: configService.get('MAIL_PORT') === 465,
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"MU Store Support" <${configService.get('MAIL_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
