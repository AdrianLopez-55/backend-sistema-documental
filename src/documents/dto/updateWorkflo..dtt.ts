import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class updateWorkflowDocumentDto {
  @ApiProperty({ example: 'workflow_A' })
  workflowName: string;
}
