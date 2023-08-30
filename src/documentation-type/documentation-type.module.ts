import { Module } from '@nestjs/common';
import { DocumentationTypeService } from './documentation-type.service';
import { DocumentationTypeController } from './documentation-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DocumentationType,
  DocumentationTypeSchema,
} from './schema/documentation-type.schema';
import { HttpModule } from '@nestjs/axios';
import { CustomErrorService } from 'src/error.service';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentationType.name, schema: DocumentationTypeSchema },
      { name: Rol.name, schema: RolSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
    HttpModule,
  ],
  controllers: [DocumentationTypeController],
  providers: [DocumentationTypeService, CustomErrorService],
})
export class DocumentationTypeModule {}
