import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { TypedConfigService } from 'src/config/typed-config.service';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly typedConfigService: TypedConfigService,
    private readonly jwtService: JwtService,
  ) {}

  sign(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.typedConfigService.get('JWT_SECRET'),
      expiresIn: this.typedConfigService.get('JWT_EXPIRES_IN'),
    });
  }
}
