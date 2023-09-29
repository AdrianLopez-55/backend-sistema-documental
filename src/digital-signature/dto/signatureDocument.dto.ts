import { ApiProperty } from '@nestjs/swagger';

export class signatureDocumentDto {
  @ApiProperty()
  pin: string;
}
