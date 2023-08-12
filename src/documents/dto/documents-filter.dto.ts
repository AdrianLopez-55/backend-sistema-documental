import { ApiProperty } from "@nestjs/swagger";

export class DocumentsFilter {
	@ApiProperty({
		example: 'DOC-001',
		description: 'search document by number document',
		required: false,
	})
	numberDocument: string;

	@ApiProperty({
		example: 'Gastos',
		description: 'search document by title',
		required: false,
	})
	title: string;

	@ApiProperty({
		example: 'Costos',
		description: 'search document by documentation type',
		required: false,
	})
	typeName: string;

	@ApiProperty({
		example: 'Revision',
		description: 'search document by state',
		required: false,
	})
	stateDocument: string;

	@ApiProperty({
		example: 'workflow_A',
		description: 'search document by workflow name',
		required: false,
	})
	nombre: string;

	@ApiProperty({
		example: 'this is description',
		description: 'search document by description',
		required: false,
	})
	description: string;
}