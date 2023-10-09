import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { PasoDto } from 'src/step/dto/paso.dto';
import { StepDto } from 'src/step/dto/step.dto';
import { Step } from 'src/step/schemas/step.schema';

export class WorkflowDto {
  @ApiProperty({ description: 'nombre del workflow' })
  nombre: string;

  @ApiProperty({ description: 'add a description from a workflow' })
  descriptionWorkflow: string;

  @ApiProperty({ description: 'Pasos en formato JSON' })
  @ValidateNested({ each: true })
  @Type(() => PasoDto)
  pasos: PasoDto[];
}
