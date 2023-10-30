import { Document, Schema, model } from 'mongoose';

export interface SequenceDocument extends Document {
  key: string;
  year: string;
  count: number;
}

export const sequenceSchema = new Schema<SequenceDocument>({
  key: { type: String, required: true },
  year: { type: String, required: true },
  count: { type: Number, required: true },
});

export const SequenceModel = model<SequenceDocument>(
  'Sequence',
  sequenceSchema,
);
