import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type StateDocumentDocuments = StateDocument & Document;

@Schema()
export class StateDocument {
  @Prop({ uppercase: true })
  stateDocumentName: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now(), immutable: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const StateDocumentSchema = SchemaFactory.createForClass(StateDocument);
export type StateDocumentModel = Model<StateDocument>;
