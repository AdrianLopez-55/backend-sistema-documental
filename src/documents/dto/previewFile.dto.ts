import { ApiProperty } from '@nestjs/swagger';

export class PreviewFileDto {
  @ApiProperty()
  html: string;
}
