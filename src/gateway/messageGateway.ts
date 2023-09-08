import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(80, {
  cors: { origin: '*' },
})
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(server: any) {
    console.log('al encender esto se muestra');
    console.log('mira esto');
  }

  handleConnection(client: any, ...args: any[]) {
    console.log('alguien se conecto al socket XD');
  }

  handleDisconnect(client: any) {}
}
