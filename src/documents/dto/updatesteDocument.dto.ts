import { ApiProperty } from '@nestjs/swagger';

export class UpdateSteDocumentDto {
  @ApiProperty()
  nameOfice: string;

  @ApiProperty()
  numberPaso: number;
}
