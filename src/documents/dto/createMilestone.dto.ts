import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateMilestoneDto {
  @ApiProperty({ example: 'Completion of the software design phase' })
  @IsString()
  readonly typeMilestone: string;

  @ApiProperty({
    example: 'The milestone marks the culmination of the design phase',
  })
  @IsString()
  readonly descriptionMilestone: string;
}
