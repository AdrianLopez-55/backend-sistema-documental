import { ApiProperty } from "@nestjs/swagger";

export class ObtainOrganigramaDataDto {
	@ApiProperty()
	_id: string

	@ApiProperty()
	name: string

	@ApiProperty()
	children: string[];
}