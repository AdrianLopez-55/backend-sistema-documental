import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Model, SchemaTypes, mongo } from 'mongoose';
import { Step, StepSchema } from 'src/step/schemas/step.schema';

export type WorkflowDocuments = Workflow & Document;

@Schema()
export class Workflow {
  @Prop({ uppercase: true })
  nombre: string;

  @Prop({ uppercase: true })
  descriptionWorkflow: string;

  @Prop({ type: Object })
  pasos: Array<{
    paso: number;
    idOffice: string;
    oficina: string;
    completado: boolean;
  }>;

  @Prop()
  idStep: string;

  @Prop({ default: 0 })
  pasoActual: number;

  @Prop()
  oficinaActual: string;

  @Prop({ default: new Date().toLocaleString(), immutable: true })
  createdAt: Date;

  @Prop({ default: new Date().toLocaleString() })
  updateAt: Date;

  @Prop({ default: true })
  activeWorkflow: boolean;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);
export type WorkflowModel = Model<Workflow>;
