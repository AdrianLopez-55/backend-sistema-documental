import { ApiProperty } from '@nestjs/swagger';

export class StateDocumentFilter {
  @ApiProperty({
    example: 'INICIADO',
    description: 'search state document by name',
    required: false,
  })
  stateDocumentName: string;
}
