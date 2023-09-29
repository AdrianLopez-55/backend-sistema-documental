import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignedDocumentDto {
  @ApiProperty()
  numberDocument: string;

  @ApiProperty()
  ciUserDestination: string;
}
