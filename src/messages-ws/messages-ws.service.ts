import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

interface ConnectedClients {
  [id: string]: {
    socket: Socket;
    user: {
      _id: string;
      name: string;
      lastName: string;
      email: string;
    };
  };
}

@Injectable()
export class MessagesWsService {
  private connectedClients: ConnectedClients = {};

  async registerClient(
    client: Socket,
    user: { _id: string; name: string; lastName: string; email: string },
  ) {
    if (user === undefined) {
      throw new Error('User nos exist');
    }

    this.connectedClients[client.id] = {
      socket: client,
      user: user,
    };
  }

  removeClient(clientId: string) {
    delete this.connectedClients[clientId];
  }

  getConnectedClients(): string[] {
    // console.log(this.connectedClients);
    return Object.keys(this.connectedClients); //ids de los clientes conectados
  }

  getUserFullName(socketId: string) {
    return this.connectedClients[socketId].user.name;
  }
}
