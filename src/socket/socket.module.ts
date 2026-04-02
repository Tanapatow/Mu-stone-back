import { Global, Module } from '@nestjs/common';
import { OrderGateway } from './order.gateway';
import { ChatGateway } from './chat.gateway';
import { ChatModule } from 'src/chat/chat.module';
import { SecurityModule } from 'src/shared/security/security.module';

@Global()
@Module({
  imports: [ChatModule, SecurityModule],
  providers: [OrderGateway, ChatGateway],
  exports: [OrderGateway],
})
export class SocketModule {}
