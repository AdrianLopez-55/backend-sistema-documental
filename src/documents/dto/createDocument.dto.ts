import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDocumentDTO {
  @ApiProperty({ example: 'Memorandum-2023' })
  @IsString()
  readonly title: string;

  @ApiProperty({ example: 'Licencia' })
  @IsString()
  documentTypeName: string;

  @ApiProperty({ example: 'Revision' })
  @IsString()
  readonly stateDocument: string;

  // @ApiProperty({ example: 'workflow_A', })
  // workflowName: string;

  @ApiProperty({
    example: 'contract document registration for new staff. It is on revision',
  })
  @IsString()
  readonly description: string;

  @ApiProperty({ example: 'data:@file/jpeg;base64,/9jq' })
  file: string;
}
