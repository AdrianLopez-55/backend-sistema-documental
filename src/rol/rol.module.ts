import { Module } from '@nestjs/common';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Rol, RolSchema } from './schema/rol.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rol.name, schema: RolSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
    HttpModule,
  ],
  controllers: [RolController],
  providers: [RolService],
})
export class RolModule {}
