import 'express';
import { GooglePayload } from 'src/auth/strategies/google.strategy';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';

declare module 'express' {
  interface Request {
    user?: JwtPayload | GooglePayload;
  }
}
