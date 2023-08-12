import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ObtainWorkflowDataDto {
  @ApiProperty()
  @IsString()
  _idworkflow: string;

  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty()
  stepsWorkflow: string[];
}
