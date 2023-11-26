import { ApiProperty } from '@nestjs/swagger';

export class AddFileToDocumentDto {
  @ApiProperty({ type: [String] })
  file: string[];
}
