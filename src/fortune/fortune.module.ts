import { Module } from '@nestjs/common';
import { FortuneController } from './fortune.controller';
import { FortuneService } from './fortune.service';
import { GenaiModule } from 'src/shared/genai/genai.module';

@Module({
  imports: [GenaiModule],
  controllers: [FortuneController],
  providers: [FortuneService],
})
export class FortuneModule {}
