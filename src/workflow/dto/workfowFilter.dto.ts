import { ApiProperty } from "@nestjs/swagger";

export class WorkflowFilter {
	@ApiProperty({
		example: 'workflow A',
		description: 'search workflow by name',
		required: false,
	})
	nombre: string;

	@ApiProperty({
		example: 'step A',
		description: 'search workflow by step name',
		required: false,
	})
	step: string;
}