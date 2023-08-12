import { IsOptional, IsString, MinLength } from "class-validator";

export class FilterDto {
	@IsOptional()
	@IsString()
	@MinLength(3)
	numberDocument?: string;

	@IsOptional()
	@IsString()
	@MinLength(3)
	title?: string;
}