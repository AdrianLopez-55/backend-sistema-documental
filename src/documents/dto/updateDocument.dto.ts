import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, isArray } from "class-validator";

export class UpdateDocumentDTO {
	// @ApiProperty({example: 'DOC-001'})
	// @IsString()
	// readonly numberDocument: string

	@ApiProperty({example: 'Resources from DataCenter'})
	@IsString()
	readonly title: string;

	@ApiProperty({example: 'J. Adrian Chase'})
	@IsString()
	readonly authorDocument: string;

	@ApiProperty({example: '/archivos/documento001.pdf'})
	@IsString()
	readonly digitalUbication: string;

	@ApiProperty({example: 'Resource'})
	@IsString()
	readonly documentType: string;

	@ApiProperty({example: 'aprobado'})
	@IsString()
	readonly stateDocument: string;

	@ApiProperty({example: 'Restringido'})
	@IsString()
	readonly nivelAcces: string;

	@ApiProperty({example: 'The resources that were sent to the data center for their ...'})
	@IsString()
	readonly description: string;
}