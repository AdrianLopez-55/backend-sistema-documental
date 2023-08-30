import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasoWorkflowDto {
  @ApiProperty()
  paso: number;

  @ApiProperty()
  nameOfice: string;
}
