import { ApiProperty } from "@nestjs/swagger";

export class CreateDocumentDestinationDto {
	@ApiProperty({ example: 'derecho' })
	readonly documentDestination: string
}