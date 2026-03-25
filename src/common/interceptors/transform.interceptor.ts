import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Request } from 'express';
import { map, Observable } from 'rxjs';
import { SuccessResponse } from 'src/common/types/response.type';
import { RESPONSE_MESSAGE_KEY } from '../decorators/message-response.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url;

    const message = this.reflector.getAllAndOverride<string | undefined>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        message,
        data,
        path,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
