import { IsArray, ValidateNested, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PasoDto } from './paso.dto';

export class StepDto {
  @ApiProperty({ description: 'Nombre del step' })
  @IsString()
  step: string;

  @ApiProperty({ example: 'description from step', description: 'description from step' })
  @IsString()
  descriptionStep: string;

  @ApiProperty({ description: 'Pasos en formato JSON' })
  @ValidateNested({ each: true })
  @Type(() => PasoDto)
  pasos: PasoDto[];
}