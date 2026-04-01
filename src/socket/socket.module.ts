import { Global, Module } from '@nestjs/common';
import { OrderGateway } from './order.gateway';

@Global()
@Module({
  providers: [OrderGateway],
  exports: [OrderGateway],
})
export class SocketModule {}
