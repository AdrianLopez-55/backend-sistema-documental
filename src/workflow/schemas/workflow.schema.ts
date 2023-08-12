import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Model, SchemaTypes, mongo } from "mongoose";
import { Step, StepSchema } from "src/step/schemas/step.schema";

export type WorkflowDocuments = Workflow & Document;

@Schema()
export class Workflow {
	@Prop({ required: true, uppercase: true })
	nombre: string;

	@Prop({ uppercase: true })
	descriptionWorkflow: string

	@Prop({ type: [{ type: [StepSchema], ref: 'Step' }] })
	steps: Step[];

	@Prop({ default: 0 })
	pasoActual: number;

	@Prop()
	oficinaActual: string

	@Prop({ default: Date.now() })
	createdAt: Date;

	@Prop({ default: Date.now() })
	updateAt: Date;

	@Prop({ default: true })
	activeWorkflow: boolean;

}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);
export type WorkflowModel = Model<Workflow>;
