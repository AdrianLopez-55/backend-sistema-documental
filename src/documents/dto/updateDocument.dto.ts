import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateDocumentDTO } from './createDocument.dto';

export class UpdateDocumentDTO extends PartialType(CreateDocumentDTO) {
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
