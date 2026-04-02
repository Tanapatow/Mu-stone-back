import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { AuthSocket } from 'src/@types/socket';
import { AuthTokenService } from 'src/shared/security/services/auth-token.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 🌟 1. เปลี่ยนจาก Http เป็น Ws และดึง Socket Client ออกมา
    const client: AuthSocket = context.switchToWs().getClient<AuthSocket>();
    // 🌟 2. ดึง Token (Socket จะส่งมาทาง handshake)
    // 🌟 1. ดึงจาก auth พร้อมระบุ Type ว่าข้างในต้องมี token ที่เป็น string (ถ้ามี)
    const auth = client.handshake.auth as { token?: string };

    // 🌟 2. ดึงจาก headers
    const authorization = client.handshake.headers.authorization;

    // 🌟 3. รวมร่างและเช็ก Type ให้ชัวร์ก่อน split
    const token =
      auth.token ||
      (typeof authorization === 'string'
        ? authorization.split(' ')[1]
        : undefined);

    if (!token) {
      // ใน Socket เราจะใช้ WsException แทน HttpException (BadRequestException)
      throw new WsException({
        message: 'Authorization is required.',
        code: 'INVALID_AUTHORIZATION_HEADER',
      });
    }

    try {
      // 🌟 3. Verify Token แบบเดียวกับที่คุณทำเลย!
      const payload = await this.authTokenService.verify(token);

      // 🌟 4. ยัด Payload ใส่ client.data (คล้ายๆ request.user)
      client.data.user = payload;

      return true; // ยืนยันว่าผ่าน Guard
    } catch {
      throw new WsException({
        message: 'Token ไม่ถูกต้องหรือหมดอายุ',
        code: 'UNAUTHORIZED',
      });
    }
  }
}
