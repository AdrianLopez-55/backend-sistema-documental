import { ApiProperty } from '@nestjs/swagger';

export class SendHtmlFileDto {
  @ApiProperty()
  htmlContent: string;

  @ApiProperty()
  nameFile: string;

  @ApiProperty()
  descriptionFile: string;
}
