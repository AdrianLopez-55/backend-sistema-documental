import { ApiProperty } from '@nestjs/swagger';

export class CreateStateDocumentDto {
  @ApiProperty({ example: 'ENVIADO' })
  readonly stateDocumentName: string;
}
