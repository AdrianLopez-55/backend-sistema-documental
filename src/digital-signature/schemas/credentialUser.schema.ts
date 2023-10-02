import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type CredentialUserDocument = CredentialUser & Document;

@Schema()
export class CredentialUser {
  @Prop()
  userId: string;

  @Prop()
  publicKey: string;

  @Prop()
  privateKey: string;

  @Prop({ default: Date.now() })
  createdAt: Date;
}

export const CredentialUserSchema =
  SchemaFactory.createForClass(CredentialUser);
export type CredentialUserModel = Model<CredentialUser>;