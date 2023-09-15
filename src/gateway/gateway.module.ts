import { Module } from '@nestjs/common';
import { MessageGateway } from './gateway';

@Module({
  providers: [MessageGateway],
})
export class GatewayModule {}
