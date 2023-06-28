import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginCentralAuthDTO{
	@ApiProperty()
	@IsString()
	readonly app: string;
	
	@ApiProperty()
	@IsString()
	readonly token: string;
}