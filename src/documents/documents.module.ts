import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Documents, DocumentsSchema } from './schema/documents.schema';
import { SequenceService } from './sequenceService.service';
import { HttpModule } from '@nestjs/axios';
import { DocumentationTypeService } from 'src/documentation-type/documentation-type.service';
import {
  DocumentationType,
  DocumentationTypeSchema,
} from 'src/documentation-type/schema/documentation-type.schema';
import { ObtainPersonalDataTokenDTO } from 'src/ServiceApi/obtainPersonalData';
import { ApiService } from 'src/ServiceApi/api.service';
import { ApiModule } from 'src/ServiceApi/api.module';
import { AuthGuard } from 'src/guards/auth.guard';
import { WorkflowService } from 'src/workflow/workflow.service';
import { Workflow, WorkflowSchema } from 'src/workflow/schemas/workflow.schema';
import { WorkflowModule } from 'src/workflow/workflow.module';
import { StepModule } from 'src/step/step.module';
import { Step, StepSchema } from 'src/step/schemas/step.schema';
import { DocumentationTypeModule } from 'src/documentation-type/documentation-type.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Documents.name, schema: DocumentsSchema },
      { name: DocumentationType.name, schema: DocumentationTypeSchema },
      { name: Workflow.name, schema: WorkflowSchema },
      { name: Step.name, schema: StepSchema },
    ]),
    HttpModule,
    WorkflowModule,
    StepModule,
    DocumentationTypeModule
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService, 
    SequenceService, 
    DocumentationTypeService, 
    ObtainPersonalDataTokenDTO, 
    ApiService,
    AuthGuard,
    WorkflowService,
  ],
})
export class DocumentsModule {}
