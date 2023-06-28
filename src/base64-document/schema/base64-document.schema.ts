import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";


@Schema()
export class Comment {
	@Prop()
	mime: Date;

	@Prop()
	base64: string;

	@Prop()
	filename: string

	@Prop()
	extesion: string

	@Prop()
	category: string

}

export const CommentSchema = SchemaFactory.createForClass(Comment);
export type CommentModel = Model<Comment>;