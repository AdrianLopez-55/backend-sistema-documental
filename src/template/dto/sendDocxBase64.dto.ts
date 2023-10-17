import { ApiProperty } from '@nestjs/swagger';

export class SendDocxBase64Dto {
  @ApiProperty()
  nameTemplate: string;

  @ApiProperty()
  descriptionTemplate: string;

  @ApiProperty()
  base64Docx: string;
}
