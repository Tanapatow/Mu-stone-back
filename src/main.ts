import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Nest application failed during bootstrap',
    error instanceof Error ? error.message : 'Unexpected occurred error',
  );
});
