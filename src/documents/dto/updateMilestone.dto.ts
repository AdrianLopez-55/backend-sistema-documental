import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateMilestoneDto } from './createMilestone.dto';

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {}
