import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class ObtainDataPersonalDTO {
	@ApiProperty()
	@IsString()
	_id?: string
	
	@ApiProperty()
	@IsString()
	name?: string;

	@ApiProperty()
	@IsString()
	ci?: string;

	@ApiProperty()
	@IsString()
	email?: string;

	@ApiProperty()
	@IsString()
	phone?: string;

	@ApiProperty()
	@IsString()
	nationality?: string;
}