import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Model } from "mongoose";

// export type Base64FileDocument = Model<Base64File>
export type Base64FileDocument = Base64File & Document

@Schema()
export class Base64File {
	// @Prop()
	// mime: Date;

	// @Prop()
	// base64: string;

	// @Prop()
	// filename: string

	// @Prop()
	// extesion: string

	// @Prop()
	// category: string

	@Prop({default: null})
	file?: string

}

export type Base64FileModel = Model<Base64File>;
export const Base64FileSchema = SchemaFactory.createForClass(Base64File);

