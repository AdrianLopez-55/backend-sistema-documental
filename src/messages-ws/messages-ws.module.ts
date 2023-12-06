import { Module } from '@nestjs/common';
import { MessagesWsService } from './messages-ws.service';
import { MessagesWsGateway } from './messages-ws.gateway';
// import { RolesGuard } from 'src/guard/roles.guard';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import { HttpModule } from '@nestjs/axios';
// import { APP_GUARD } from '@nestjs/core';
import { UserService } from 'src/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      // { name: Documents.name, schema: DocumentsSchema },
      // { name: SequenceModel.name, schema: sequenceSchema },
      // { name: EstadoUbiacion.name, schema: EstadoUbiacionSchema },
      // { name: DocumentationType.name, schema: DocumentationTypeSchema },
      // { name: File.name, schema: FileSchema },
      // { name: Template.name, schema: TemplateSchema },
      // { name: Workflow.name, schema: WorkflowSchema },
      // { name: Step.name, schema: StepSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Rol.name, schema: RolSchema },
      // { name: Bitacora.name, schema: BitacoraSchema },
    ]),
    HttpModule,
    // WorkflowModule,
    // StepModule,
    // DocumentationTypeModule,
    // EstadoUbicacionModule,
    // FileModule,
  ],
  providers: [
    MessagesWsGateway,
    MessagesWsService,
    UserService,
    // RolesGuard,
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
})
export class MessagesWsModule {}
