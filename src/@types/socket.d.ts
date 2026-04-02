import { Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.type';

// 🌟 สร้าง Type เฉพาะกิจขึ้นมา
export interface AuthSocket extends Socket {
  data: {
    user: JwtPayload;
  };
}
