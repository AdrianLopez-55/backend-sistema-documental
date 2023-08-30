import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Model } from 'mongoose';

// export type PermissionDocument = Permission & Document;
export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ versionKey: '__v' })
export class Permission {
  @Prop({ required: true, set: (value) => value.toUpperCase() })
  permissionName: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updateAt: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
export type PermissionModel = Model<Permission>;
