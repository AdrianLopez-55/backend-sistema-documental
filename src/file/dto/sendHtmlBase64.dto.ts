import { ApiProperty } from '@nestjs/swagger';

export class SendHtmlBase64Dto {
  @ApiProperty()
  htmlContent: string;

  @ApiProperty()
  nameFile: string;

  @ApiProperty()
  descriptionFile: string;

  @ApiProperty({
    type: [String],
    example: ['data:@file/jpeg;base64,/9jq'],
  })
  base64File: string[];
}
