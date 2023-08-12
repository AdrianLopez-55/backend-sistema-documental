import { ApiOperation, ApiProperty } from "@nestjs/swagger";

export class PasoDto {
	@ApiProperty({ example: '1',description: 'numero del paso' })
	paso: number;

	@ApiProperty({ example: 'oficina A', description: 'nombre oficina' })
	oficina: string;

	@ApiProperty()
	idOffice: string

	@ApiProperty({ description: 'Indica si el paso está completado' })
	completado: boolean;
}