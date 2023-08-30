import { ApiProperty } from '@nestjs/swagger';

export class AddWorkflowDocumentDto {
  @ApiProperty({ example: 'workflow_A' })
  worflowName: string;

  @ApiProperty({ example: ['54758', '4454'] })
  ci: string[];
}
