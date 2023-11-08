import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class FileDto {
  @ApiProperty({ example: 'data:@file/jpeg;base64,/9jq' })
  base64: string;
}

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
    type: [String],
    example: ['data:@file/jpeg;base64,/9jq'],
  })
  file: string[];
}
