import { Module } from '@nestjs/common';
import { PermissionsService } from './permission.service';
import { PermissionsController } from './permission.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { HttpModule } from '@nestjs/axios';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: Rol.name, schema: RolSchema },
    ]),
    HttpModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
