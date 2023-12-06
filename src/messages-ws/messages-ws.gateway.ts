import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { RolesGuard } from 'src/guard/roles.guard';
import { Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { UserService } from 'src/user.service';

@UseGuards(RolesGuard)
@WebSocketGateway({ cors: true })
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    // private readonly rolesGuard: RolesGuard, //nuevooooooo
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization as string;
    // console.log(token);

    try {
      let payload = await this.userService.getPermissionsFromToken(token);
      await this.messagesWsService.registerClient(client, payload);
    } catch (error) {
      client.disconnect();
      return;
    }

    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }
  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }

  @SubscribeMessage('message-form-client') //definir nombre del mensaje que se escuchara
  async onMessageFromClient(
    client: Socket,
    payload: NewMessageDto,
    // @Req() req,
  ) {
    // console.log(client, payload);

    if (!payload || !payload.message) {
      console.log('Payload o payload.message es undefined.', payload);
      return;
    }

    //! emite unicamente al cliente INICIAL, a client, no a todos los clientes
    // client.emit('message-form-server', {
    //   fullName: 'soy yo!',
    //   message: payload.message || 'no-message',
    // });

    // ! Emitir a todos MENOS, al cliente inicial
    client.broadcast.emit('message-form-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message',
    });

    //! Emitir a TODOS los clientes
    // this.wss.emit('message-form-server', {
    //   fullName: this.messagesWsService.getUserFullName(client.id),
    //   message: payload.message || 'no-message',
    // });
  }

  // @SubscribeMessage('event_join')
  // handleJoinRoom(client: Socket, room: string) {
  //   client.join(`room_${room}`);
  // }

  // @SubscribeMessage('event_message')
  // handleIncommigMessage(client: Socket, room: string, payload: NewMessageDto) {
  //   // console.log(room);
  //   this.wss.to(room).emit('event_message', payload.message);
  // }

  // @SubscribeMessage('event_leave')
  // handleRoomLeave(client: Socket, room: string) {
  //   client.leave(`room_${room}`);
  // }
}
