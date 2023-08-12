import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';
import { CreateCommentDto } from './createComment.dto';

export class UpdateCommentDto extends PartialType(CreateCommentDto){}
