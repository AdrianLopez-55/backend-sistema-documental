import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Model } from 'mongoose';

export type RolDocument = HydratedDocument<Rol>;

@Schema()
export class Rol {
  @Prop({ required: true })
  rolName: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }] })
  permissionName: string[];

  @Prop({ default: true })
  activeRol: boolean;

  @Prop({ default: Date.now, unique: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const RolSchema = SchemaFactory.createForClass(Rol);
export type PermissionModel = Model<Rol>;
