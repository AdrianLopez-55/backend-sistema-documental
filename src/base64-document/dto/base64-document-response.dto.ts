import { ApiProperty } from "@nestjs/swagger";

export class Base64DocumentResponseDTO {
	@ApiProperty()
	_id: string
	
	@ApiProperty()
	filename: string;

	@ApiProperty()
	extension: string;

	@ApiProperty()
	size: number

	@ApiProperty()
	filePath: string

	@ApiProperty()
	status: string
  
	@ApiProperty()
	category: string;

	@ApiProperty()
	mime: string;

	@ApiProperty()
	base64: string
}