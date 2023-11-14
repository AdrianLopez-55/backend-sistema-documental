import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

export type BitacoraDocuments = Bitacora & Document;

@Schema({ timestamps: true })
export class Bitacora {
  @Prop()
  userId: string;

  @Prop()
  userEmail: string;

  @Prop()
  action: string;

  @Prop()
  description: string;

  @Prop()
  path: string;

  @Prop()
  timestamp: string;

  @Prop()
  log: mongoose.Schema.Types.Mixed;
}

export const BitacoraSchema = SchemaFactory.createForClass(Bitacora);
export type BitacoraModel = Model<Bitacora>;
