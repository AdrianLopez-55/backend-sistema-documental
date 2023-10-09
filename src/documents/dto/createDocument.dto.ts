import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDocumentDTO {
  @ApiProperty({ example: 'Memorandum-2023' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Licencia' })
  @IsString()
  documentTypeName: string;

  @ApiProperty({
    example: 'contract document registration for new staff. It is on revision',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'data:@file/jpeg;base64,/9jq',
  })
  file: string;
}
