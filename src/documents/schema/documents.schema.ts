import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Model, mongo } from 'mongoose';
import { Comment, CommentSchema } from './comment.schema';
import { MIlestoneSchema, Milestone } from './milestone.schema';
import { Workflow, WorkflowSchema } from 'src/workflow/schemas/workflow.schema';
import { DocumentationType, DocumentationTypeSchema } from 'src/documentation-type/schema/documentation-type.schema';

export type DocumentDocument = Documents & Document;

@Schema({ versionKey: '__v' })
export class Documents {
  @Prop({ default: () => `DOC-${incrementalValue(0)}` })
  numberDocument: string;

  @Prop({ uppercase: true })
  title: string;

  @Prop({ type: DocumentationTypeSchema, ref: 'DocumentationType' })
  documentationType: DocumentationType;

  @Prop({ uppercase: true })
  stateDocument: string;

  @Prop({ type: WorkflowSchema, ref: 'Workflow' })
  workflow: Workflow;

  @Prop({ uppercase: true })
  description: string;

  @Prop({ default: null })
  fileRegister: mongoose.Schema.Types.Mixed;

  @Prop({ default: null })
  fileBase64: string;

  @Prop()
  idTemplate: string;

  @Prop()
  base64Template: string;

  @Prop([CommentSchema])
  comments: Comment[];

  @Prop([MIlestoneSchema])
  milestone: Milestone[];

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now(), immutable: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updateAt: Date;

  @Prop({ default: 'create' })
  state: string;

  @Prop({ type: [{ oficinaActual: String, oficinasPorPasar: Array }] })
  bitacoraWorkflow: { oficinaActual: string; oficinasPorPasar: string[] }[];
}

export const DocumentsSchema = SchemaFactory.createForClass(Documents);
export type DocumentsModel = Model<Documents>;

function incrementalValue(count: number): string {
  const nextValue = count + 1;
  const paddedValue = String(nextValue).padStart(3, '0');
  return `DOC-${paddedValue}`;
}
