import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Workflow, WorkflowSchema } from './schemas/workflow.schema';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { StepModule } from 'src/step/step.module';
import { Step, StepSchema } from 'src/step/schemas/step.schema';
import { StepService } from 'src/step/step.service';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Workflow.name, schema: WorkflowSchema },
			{ name: Step.name, schema: StepSchema }
		]),
		StepModule,
		HttpModule
	],
	providers: [WorkflowService, StepService],
	exports: [WorkflowService],
	controllers: [WorkflowController]
})
export class WorkflowModule {}
