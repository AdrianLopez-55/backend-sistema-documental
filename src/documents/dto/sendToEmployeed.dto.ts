import { ApiProperty } from '@nestjs/swagger';

export class SendToEmployeedDto {
  @ApiProperty()
  documentId: string;

  @ApiProperty({ type: [String] })
  employeeCis: string[];
}
