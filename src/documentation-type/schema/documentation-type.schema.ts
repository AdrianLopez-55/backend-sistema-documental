import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type DocumentationTypeDocument = DocumentationType & Document;

@Schema({ versionKey: '__v', timestamps: false })
export class DocumentationType {
  @Prop({
    uppercase: true,
  })
  typeName: string;

  @Prop()
  idTemplateDocType: string;

  // @Prop()
  // dataUriTemplate: string;

  @Prop({ default: true })
  activeDocumentType: boolean;

  @Prop({ type: Date, default: () => new Date(), immutable: true })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date() })
  updateAt: Date;
}

export const DocumentationTypeSchema =
  SchemaFactory.createForClass(DocumentationType);
export type DocumentationTypeModel = Model<DocumentationType>;
