import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class UpdateFileRegisterDTO {
	@ApiProperty()
	@IsString()
	filename: string

	@ApiProperty()
	@IsNumber()
	size: number

	@ApiProperty()
	@IsString()
	filePath: string

	@ApiProperty()
	@IsString()
	status: string

	@ApiProperty()
	@IsString()
	category: string

	@ApiProperty()
	@IsString()
	extension: string
}