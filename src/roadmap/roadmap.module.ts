import { Module } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { RoadmapController } from './roadmap.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Roadmap, RoadmapSchema } from './schemas/roadmap.schema';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { HttpModule } from '@nestjs/axios';
import {
  AssignedDocument,
  AssignedDocumentSchema,
} from './schemas/assignedDocuments.schema';
// import { UserService } from 'src/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: AssignedDocument.name, schema: AssignedDocumentSchema },
      { name: Rol.name, schema: RolSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
    HttpModule,
  ],
  controllers: [RoadmapController],
  providers: [RoadmapService],
})
export class RoadmapModule {}
