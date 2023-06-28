import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, isString } from "class-validator";

export class CreateDocumentDTO {

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

	// @ApiProperty({example: 'Informes'})
	// @IsString()
	// category: string

	@ApiProperty({example: 'The resources that were sent to the data center for their ...'})
	@IsString()
	readonly description: string;

	// @ApiProperty({example: 'jfjoiqjenodaurieon', description: 'most be base64'})
	// @IsString()
	// readonly base64: string;

	// @ApiProperty({example: 'image/jpg', description: 'most be mime from documebt'})
	// @IsString()
	// readonly mime: string;

	// readonly filename? : string;
	// readonly extension? : string;
	// readonly category? : string;

	// constructor(fileId: string){
	// 	this.fileId = fileId;
	// }

	// @ApiProperty()
	// @IsString()
	// filename: string

	// @ApiProperty()
	// @IsString()
	// originalname: string

	// @ApiProperty()
	// @IsString()
	// filePath: string
}