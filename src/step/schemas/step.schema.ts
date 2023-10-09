import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type StepDocuments = Step & Document;

@Schema()
export class Step {
  @Prop([
    {
      paso: { type: Number, required: true },
      idOffice: { type: String, required: false },
      oficina: { type: String, required: false },
      // idUser: { type: String, required: false },
      completado: { type: Boolean, default: false },
    },
  ])
  pasos: Array<{
    paso: number;
    idOffice: string;
    oficina: string;
    // idUser: string;
    completado: boolean;
  }>;

  @Prop({ default: false })
  completado: boolean;

  @Prop({ default: Date.now(), immutable: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updateAt: Date;

  @Prop({ default: true })
  activeStep: boolean;
}

export const StepSchema = SchemaFactory.createForClass(Step);
export type StepModel = Model<Step>;
