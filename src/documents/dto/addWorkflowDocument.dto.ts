import { ApiProperty } from '@nestjs/swagger';

export class AddWorkflowDocumentDto {
  @ApiProperty({ example: 'workflow_A' })
  worflowName: string;

  @ApiProperty({ example: ['54758', '4454'] })
  ci: string[];
}

export class AddWorkflowSinCiDocumentDto {
  @ApiProperty({ example: 'workflow_A' })
  workflowName: string;
}
