import { BadRequestException, ValidationPipe } from '@nestjs/common';

export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      exceptionFactory(errors) {
        const formattedErrors = errors.reduce<Record<string, string[]>>(
          (acc, el) => {
            if (el.constraints)
              acc[el.property] = Object.values(el.constraints);
            return acc;
          },
          {},
        );
        throw new BadRequestException({
          message: 'The provided data is invalid',
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
        });
      },
    });
  }
}
