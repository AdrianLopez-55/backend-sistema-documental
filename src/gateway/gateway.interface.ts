export interface IThread {
  createdAt: Date;
  id: string;
  participants: IParticipant[];
  updatedAt: Date;
}

export interface IMessage {
  content: string;
  createdAt: Date;
  id: string;
  participant: IParticipant;
  thread: IThread;
  updatedAt: Date;
}

export class IParticipant {
  createdAt: Date;
  id: string;
  updatedAt: Date;
  userId: string;
}
