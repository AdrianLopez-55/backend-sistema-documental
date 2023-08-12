import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Model } from "mongoose"

export type PermissionDocument = Permission & Document;

@Schema({versionKey: '__v'})
export class Permission {
	@Prop()
	name: string;

	@Prop({default: true})
	active: boolean;
	
	@Prop({default: Date.now()})
	createdAt: Date

	@Prop({default: Date.now()})
	updateAt: Date
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
export type PermissionModel = Model<Permission>;
