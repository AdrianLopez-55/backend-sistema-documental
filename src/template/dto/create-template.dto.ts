import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty()
  nameTemplate: string;

  @ApiProperty()
  fileTemplateDocx: string;
}
