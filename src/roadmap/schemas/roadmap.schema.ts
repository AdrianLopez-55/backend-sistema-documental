import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import {
  AssignedDocument,
  AssignedDocumentSchema,
} from './assignedDocuments.schema';

export type RoadmapDocuments = Roadmap & Document;

@Schema()
export class Roadmap {
  @Prop({ uppercase: true })
  title: string;

  @Prop({ uppercase: true })
  description: string;

  @Prop()
  startDate: string;

  @Prop()
  updateDate: string;

  @Prop({ uppercase: true })
  objectives: string[];

  @Prop([
    {
      name: { type: String, required: false },
      priority: { type: String, required: false },
      state: { type: String, required: false },
    },
  ])
  functionalities: Array<{
    name: string;
    priority: string;
    state: string;
  }>;

  @Prop([
    {
      description: { type: String, required: false },
      mitigation: { type: String, required: false },
    },
  ])
  risks: Array<{
    description: string;
    mitigation: string;
  }>;

  @Prop({ uppercase: true })
  currentStatus: string;

  @Prop({ uppercase: true })
  additionalNotes: string;

  @Prop({ default: true })
  active: boolean;

  @Prop([AssignedDocumentSchema])
  assignedDocumets: AssignedDocument[];

  @Prop({ default: Date.now(), immutable: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const RoadmapSchema = SchemaFactory.createForClass(Roadmap);
export type RoadmapModel = Model<Roadmap>;
