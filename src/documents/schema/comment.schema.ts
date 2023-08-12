import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema()
export class Comment {
  @Prop({ uppercase: true })
  comment: string;

  @Prop({ default: true })
  activeComment: boolean;

  @Prop({ default: Date.now(), immutable: true})
  createdAt: Date;

  @Prop({ default: Date.now() })
  updateAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
export type CommentModel = Model<Comment>;
