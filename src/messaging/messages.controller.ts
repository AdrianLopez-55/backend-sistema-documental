// import { Controller, Get, Param, Post, Body } from '@nestjs/common';
// import { MessagingGateway } from './messaging.gateway'; // Asegúrate de tener la ruta correcta

// @Controller('messages')
// export class MessagesController {
//   constructor(private readonly messagingGateway: MessagingGateway) {}

//   @Post(':userId')
//   sendMessage(@Param('userId') userId: string, @Body() message: string) {
//     // Lógica para guardar el mensaje en la base de datos, etc.

//     // Enviar notificación al usuario destinatario
//     this.messagingGateway.sendNotification(userId, 'Tienes un nuevo mensaje');
//   }
// }

// import { Controller, Get, Param, Post, Body } from '@nestjs/common';
// import { MessagingService } from './messaging.service';

// @Controller('messages')
// export class MessagesController {
//   constructor(private readonly messagingService: MessagingService) {}

//   @Post(':userId')
//   sendMessage(@Param('userId') userId: string, @Body() message: string) {
//     // Lógica para guardar el mensaje en la base de datos, etc.

//     // Enviar notificación al usuario destinatario
//     this.messagingService.sendNotification(userId, 'Tienes un nuevo mensaje');
//   }
// }
