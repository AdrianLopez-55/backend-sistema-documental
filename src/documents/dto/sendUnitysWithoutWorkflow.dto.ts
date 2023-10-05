import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UnitysDto {
  @ApiProperty()
  @IsString({ each: true })
  unitys: string[];
}
