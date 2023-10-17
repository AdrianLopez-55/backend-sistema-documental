import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type TemplateDocuments = Template & Document;

@Schema()
export class Template {
  @Prop({ uppercase: true })
  nameTemplate: string;

  @Prop({ uppercase: true })
  descriptionTemplate: string;

  @Prop()
  htmlTemplate: string;

  @Prop()
  idTemplate: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
export type TemplateModel = Model<Template>;
