import { ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Request } from 'express';
import { RolesGuard } from 'src/guard/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';

// @UseGuards(RolesGuard)
// @ApiBearerAuth()
// @Permissions(Permission.USER)
@WebSocketGateway({
  cors: { origin: '*' },
})
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  afterInit(server: any) {
    console.log('al encender esto se muestra');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    // const request = args[0] as Request;
    // const user = request.user;

    // if (user) {
    //   console.log(`Usuario conectado: ${user}`);
    // } else {
    //   console.log('usuario no autenticado');
    //   client.disconnect(true);
    // }
    console.log(client.id);
    console.log('alguien se conecto al socket XD');
  }

  handleDisconnect(client: any) {
    console.log('alguien se fue');
  }

  @SubscribeMessage('event_join')
  handleJoinRoom(client: Socket, room: string) {
    client.join(`room_${room}`);
  }

  @SubscribeMessage('event_message')
  handleIncommingMessage(
    client: Socket,
    payload: { room: string; message: string },
  ) {
    const { room, message } = payload;
    console.log(payload);
    this.server.to(`room_${room}`).emit('new_message', message);
  }

  @SubscribeMessage('event_leave')
  handleRoomLeave(client: Socket, room: string) {
    console.log(`chao room_${room}`);
    client.leave(`room_${room}`);
  }
}
