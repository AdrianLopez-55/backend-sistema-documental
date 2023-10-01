import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Permission } from 'src/guard/constants/Permission';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { RolesGuard } from 'src/guard/roles.guard';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private connectedUsers = new Map<string, Socket>();

  afterInit(server: any) {
    console.log('al encender esto se muestra');
  }

  async handleConnection(client: Socket) {
    client.on('authentication', (client) => {
      console.log('alguien se conecto al socket XD');
    });
  }

  handleDisconnect(client: any) {
    const userData = client.handshake.auth.user;
    console.log(`usuario ${userData} se ha desconectado`);
  }

  @UseGuards(RolesGuard)
  @Permissions(Permission.ADMIN, Permission.USER, Permission.SUPERADMIN)
  @SubscribeMessage('event_join')
  handleJoinRoom(client: Socket, room: string) {
    client.join(`room_${room}`);
  }

  @UseGuards(RolesGuard)
  @Permissions(Permission.ADMIN, Permission.USER, Permission.SUPERADMIN)
  @SubscribeMessage('event_message')
  handleIncommingMessage(
    client: Socket,
    payload: { toUserId: string; message: string },
  ) {
    const { toUserId, message } = payload;

    const userData = client.handshake.auth.user;
    console.log(
      `usuario ${userData} envia un mensaje a ${toUserId}: ${message}`,
    );

    // const userId = client.handshake.user
    // console.log(userId);
    this.server.to(`room_${toUserId}`).emit('new_message', message);
  }

  @SubscribeMessage('event_leave')
  handleRoomLeave(client: Socket, room: string) {
    console.log(`chao room_${room}`);
    client.leave(`room_${room}`);
  }
}
