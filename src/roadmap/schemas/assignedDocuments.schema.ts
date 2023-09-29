import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type AssignedDocumentDocument = AssignedDocument & Document;

@Schema()
export class AssignedDocument {
  @Prop()
  documentId: string;

  @Prop()
  numberDocument: string;

  @Prop()
  destinationUserId: string;

  @Prop()
  ciUserDestination: string;
}

export const AssignedDocumentSchema =
  SchemaFactory.createForClass(AssignedDocument);
export type AssignedDocumentModel = Model<AssignedDocument>;
