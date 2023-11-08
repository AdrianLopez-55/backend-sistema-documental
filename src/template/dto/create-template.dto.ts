import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty()
  nameTemplate: string;

  @ApiProperty()
  descriptionTemplate: string;

  @ApiProperty()
  htmlContent: string;

  @ApiProperty()
  base64Docx: string;
}
