import { ApiProperty } from '@nestjs/swagger';

export class SendToUnitDto {
  @ApiProperty()
  documentId: string;
}
