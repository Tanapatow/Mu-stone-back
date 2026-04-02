import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Roles('ADMIN')
  @Get('admin/rooms')
  async getRoomsForAdmin() {
    return await this.chatService.getAdminRooms();
  }
}
