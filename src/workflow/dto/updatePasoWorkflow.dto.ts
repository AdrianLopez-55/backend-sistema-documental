import { ApiProperty, PartialType } from '@nestjs/swagger';
import { WorkflowDto } from './createWorkflow.dto';

export class UpdatePasoWorkflowDto extends PartialType(WorkflowDto) {}
