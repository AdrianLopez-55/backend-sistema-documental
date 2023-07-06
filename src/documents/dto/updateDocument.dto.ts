import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, isArray } from "class-validator";

export class UpdateDocumentDTO {

	@ApiProperty({example: 'Resources from DataCenter'})
	@IsString()
	readonly title: string;

	// @ApiProperty({example: 'J. Adrian Chase'})
	// @IsString()
	// readonly authorDocument: string;

	@ApiProperty({example: '8574898'})
	@IsString()
	ciPersonal: string;

	// @ApiProperty({example: '/archivos/documento001.pdf'})
	// @IsString()
	// readonly digitalUbication: string;
	
	@ApiProperty({example: 'Contract'})
	@IsString()
	readonly documentType: string;

	@ApiProperty({example: 'Revision'})
	@IsString()
	readonly stateDocument: string;

	@ApiProperty({example: 'restricted'})
	@IsString()
	readonly nivelAcces: string;

	// @ApiProperty({example: 'Informes'})
	// @IsString()
	// category: string

	@ApiProperty({example: 'contract document registration for new staff. It is on revision'})
	@IsString()
	readonly description: string;

	@ApiProperty({example: 'data:@file/jpeg;base64,/9jq'})
	file: string
}