import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";

export type StepDocuments = Step & Document

@Schema()
export class Step {
  push(nuevoPaso: WorkflowStep) {
    throw new Error('Method not implemented.');
  }
	@Prop({ required: true, uppercase: true })
	step: string;

	@Prop({ uppercase: true })
	descriptionStep: string;

	@Prop([
		{
		  paso: { type: Number, required: true },
		  idOffice: { type: String, required: false },
		  completado: { type: Boolean, default: false }, 
		},
	  ])
	  pasos: Array<{ paso: number; idOffice: string; completado: boolean }>;

	@Prop({ default: false })
	completado: boolean;

	@Prop({ default: Date.now() })
	createdAt: Date;

	@Prop({ default: Date.now() })
	updateAt: Date;

	@Prop({ default: true })
	activeStep: boolean
}

export const StepSchema = SchemaFactory.createForClass(Step);
export type StepModel = Model<Step>;

