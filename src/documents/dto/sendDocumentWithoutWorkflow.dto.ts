import { ApiProperty } from '@nestjs/swagger';

export class SendDocumentWithoutWorkflowDto {
  @ApiProperty({ example: ['12345', '98765'] })
  ci: string[];
}

export class DeriveDocumentEmployedDto {
  @ApiProperty({ example: ['12345', '98765'] })
  ci: string[];
}
