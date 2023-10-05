import { ApiProperty, PartialType } from '@nestjs/swagger';
import { WorkflowDto } from './createWorkflow.dto';

export class UpdateWorkflowDto extends PartialType(WorkflowDto) {}
