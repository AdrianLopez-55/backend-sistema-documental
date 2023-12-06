// import { Controller } from '@nestjs/common';
// // import { ApiTags } from '@nestjs/swagger';
// import {
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets';
// import { Server } from 'socket.io';

// @WebSocketGateway()
// @Controller()
// // @ApiTags('message')
// export class WebsocketsController {
//   @WebSocketServer()
//   server: Server;

//   @SubscribeMessage('message')
//   handleMessage(client: any, payload: any): void {
//     this.server.emit('newMessage', payload);
//   }

//   sendMessageToClient(clientId: string, message: string): void {
//     this.server.to(clientId).emit('newMessage', message);
//   }
// }
