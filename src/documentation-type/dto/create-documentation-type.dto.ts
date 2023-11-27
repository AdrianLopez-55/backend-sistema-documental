import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDocumentationTypeDto {
  @ApiProperty()
  @IsString()
  typeName: string;

  // @ApiProperty()
  // htmlContent: string;

  // @ApiProperty()
  // base64Docx: string;
}
