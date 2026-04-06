import { Controller, Get, Param, Post } from '@nestjs/common';
import { FortuneService } from './fortune.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';

@Controller('fortune')
export class FortuneController {
  constructor(private readonly fortuneService: FortuneService) {}

  @ResponseMessage('ทำนายดวงสำเร็จ')
  @Post('draw')
  async drawCards(@CurrentUser('sub') userId: string) {
    return await this.fortuneService.drawAndPredict(userId);
  }

  @Get('me')
  async getMyFortuneLogs(@CurrentUser('sub') userId: string) {
    return await this.fortuneService.getMyFortuneLogs(userId);
  }

  @ResponseMessage('ดึงข้อมูลการดูดวงสำเร็จ')
  @Get(':id')
  async getFortuneLog(
    @CurrentUser('sub') userId: string,
    @Param('id') logId: string,
  ) {
    return await this.fortuneService.getFortuneLogById(userId, logId);
  }
}
