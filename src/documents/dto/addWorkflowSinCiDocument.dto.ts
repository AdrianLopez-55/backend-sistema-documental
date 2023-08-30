import { ApiProperty } from '@nestjs/swagger';

export class AddWorkflowSinCiDocumentDto {
  @ApiProperty({ example: 'workflow_A' })
  workflowName: string;
}
