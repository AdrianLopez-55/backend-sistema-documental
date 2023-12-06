import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Workflow, WorkflowSchema } from './schemas/workflow.schema';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { StepModule } from 'src/step/step.module';
import { Step, StepSchema } from 'src/step/schemas/step.schema';
import { StepService } from 'src/step/step.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
// import { UserService } from 'src/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workflow.name, schema: WorkflowSchema },
      { name: Step.name, schema: StepSchema },
      { name: Rol.name, schema: RolSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
    StepModule,
    HttpModule,
  ],
  providers: [WorkflowService, StepService],
  exports: [WorkflowService],
  controllers: [WorkflowController],
})
export class WorkflowModule {}
