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
import { CustomErrorService } from 'src/error.service';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import { FindDocumentationTypeService } from './findDocumentationType.service';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';
import { EmailService } from 'src/email/email.service';
import { SendDerivedDocumentsService } from './sendDerivedDocuments.service';
import { GetDocumentsService } from './getsDocuments.service';
import { Template, TemplateSchema } from 'src/template/schemas/template.schema';
import { EstadoUbicacionModule } from 'src/estado-ubicacion/estado-ubicacion.module';
import { EstadoUbicacionService } from 'src/estado-ubicacion/estado-ubicacion.service';
import {
  EstadoUbiacion,
  EstadoUbiacionSchema,
} from 'src/estado-ubicacion/schema/estado-ubicacion.schema';
import { File, FileSchema } from 'src/file/schema/file.schema';
import { FileModule } from 'src/file/file.module';
import { SequenceModel, sequenceSchema } from './schema/sequence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Documents.name, schema: DocumentsSchema },
      { name: SequenceModel.name, schema: sequenceSchema },
      { name: EstadoUbiacion.name, schema: EstadoUbiacionSchema },
      { name: DocumentationType.name, schema: DocumentationTypeSchema },
      { name: File.name, schema: FileSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: Workflow.name, schema: WorkflowSchema },
      { name: Step.name, schema: StepSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Rol.name, schema: RolSchema },
      { name: Bitacora.name, schema: BitacoraSchema },
    ]),
    HttpModule,
    WorkflowModule,
    StepModule,
    DocumentationTypeModule,
    EstadoUbicacionModule,
    FileModule,
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
    CustomErrorService,
    FindDocumentationTypeService,
    EmailService,
    SendDerivedDocumentsService,
    GetDocumentsService,
    EstadoUbicacionService,
  ],
})
export class DocumentsModule {}
