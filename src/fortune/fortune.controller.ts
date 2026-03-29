import { Controller, Post } from '@nestjs/common';
import { FortuneService } from './fortune.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('fortune')
export class FortuneController {
  constructor(private readonly fortuneService: FortuneService) {}

  @Post('draw')
  async drawCards(@CurrentUser('sub') userId: string) {
    return await this.fortuneService.drawAndPredict(userId);
  }
}
