import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Model } from 'mongoose';

export type MilestoneDocument = Milestone & Document;

@Schema()
export class Milestone {
  @Prop({ uppercase: true })
  typeMIlestone: string;

  @Prop()
  userId: string;

  @Prop({ uppercase: true })
  description: string;

  @Prop({ default: true })
  activeMilestone: boolean;

  @Prop({ default: Date.now(), immutable: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updateAt: Date;
}

export const MIlestoneSchema = SchemaFactory.createForClass(Milestone);
export type MilestoneModel = Model<Milestone>;
