import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { GlobalValidationPipe } from './common/pipes/global.validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(new GlobalValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Nest application failed during bootstrap',
    error instanceof Error ? error.message : 'Unexpected occurred error',
  );
});
