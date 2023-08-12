import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ObtainPersonalDataTokenDTO {
	@ApiProperty()
	@IsString()
	_idPersonal?: string;
  
	@ApiProperty()
	@IsString()
	name?: string;
	
	@ApiProperty()
	@IsString()
	lastname?: string;

	@ApiProperty()
	@IsString()
	ci?: string;
  
	@ApiProperty()
	@IsString()
	email?: string;
  
	@ApiProperty()
	@IsString()
	nationality?: string;
}