import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Date } from 'mongoose';

export class CreateCommentDto {
  @ApiProperty({ example: 'Esto es mi comentario del documeto' })
  @IsString()
  readonly comment: string;
}
