import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { StepDto } from "src/step/dto/step.dto";
import { Step } from "src/step/schemas/step.schema";

export class WorkflowDto {
	@ApiProperty({ description: 'nombre del workflow' })
	nombre: string;

	@ApiProperty({ description: 'add a description from a workflow' })
	descriptionWorkflow: string;

	@ApiProperty()
	stepName: string;

}