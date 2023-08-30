import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type TemplateDocuments = Template & Document;

@Schema()
export class Template {
  @Prop({ default: null })
  nameTemplate: string;

  @Prop({ default: null })
  dataTemplate: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
export type TemplateModel = Model<Template>;
