// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { MessagingService } from './messaging.service';

// @WebSocketGateway()
// export class MessagingGateway
//   implements OnGatewayConnection, OnGatewayDisconnect
// {
//   @WebSocketServer() server: Server;

//   constructor(private readonly messagingService: MessagingService) {}

//   handleConnection(client: Socket) {
//     // Lógica para manejar la conexión del cliente, si es necesario
//   }

//   handleDisconnect(client: Socket) {
//     // Lógica para manejar la desconexión del cliente, si es necesario
//   }

//   addUser(userId: string, client: Socket) {
//     this.messagingService.addUser(userId, client);
//   }

//   sendNotification(userId: string, message: string) {
//     this.messagingService.sendNotification(userId, message);
//   }

//   @SubscribeMessage('newMessage')
//   handleMessage(client, payload: any) {
//     // Manejar el mensaje recibido
//     this.server.emit('newMessage', payload);
//   }
// }
