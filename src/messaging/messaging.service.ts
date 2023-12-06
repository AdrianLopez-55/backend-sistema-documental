// import { Injectable, Logger } from '@nestjs/common';
// import { Socket } from 'socket.io';
// import { MessagingGateway } from './messaging.gateway';

// @Injectable()
// export class MessagingService {
//   private readonly logger = new Logger(MessagingService.name);

//   constructor(private readonly messagingGateway: MessagingGateway) {}

//   // Registro de usuarios conectados
//   addUser(userId: string, client: Socket) {
//     this.messagingGateway.addUser(userId, client);
//     this.logger.log(`Usuario registrado con ID: ${userId}`);
//   }

//   // Envío de notificación a un usuario específico
//   sendNotification(userId: string, message: string) {
//     this.messagingGateway.sendNotification(userId, message);
//     this.logger.log(`Notificación enviada a ${userId}: ${message}`);
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { Socket } from 'socket.io';

// @Injectable()
// export class MessagingService {
//   private readonly clients: Map<string, Socket> = new Map();

//   // Registro de usuarios conectados
//   addUser(userId: string, client: Socket) {
//     this.clients.set(userId, client);
//   }

//   // Envío de notificación a un usuario específico
//   sendNotification(userId: string, message: string) {
//     const client = this.clients.get(userId);
//     if (client) {
//       client.emit('newMessage', message);
//     }
//   }
// }
