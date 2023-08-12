import { ApiProperty } from "@nestjs/swagger";

export class DocumentationTypeFilter {
	@ApiProperty({
		example: 'Licencia',
		description: 'search documetation type by name',
		required: false,
	})
	typeName: string;
}