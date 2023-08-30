import { ApiProperty } from '@nestjs/swagger';

export class updateOnlyPasoDto {
  @ApiProperty()
  numberPaso: number;

  @ApiProperty()
  nameOfice: string;
}
