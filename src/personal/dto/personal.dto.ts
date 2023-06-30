import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class SendIDPersonalDTO {
	@ApiProperty()
	@IsString()
	_id?: string
}