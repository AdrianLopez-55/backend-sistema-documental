import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type PinUserDocument = PinUser & Document;

@Schema()
export class PinUser {
  @Prop()
  userId: string;

  @Prop({ unique: true })
  hasPin: string;

  @Prop({ default: Date.now() })
  createdAt: Date;
}

export const PinUserSchema = SchemaFactory.createForClass(PinUser);
export type PinUserModel = Model<PinUser>;
