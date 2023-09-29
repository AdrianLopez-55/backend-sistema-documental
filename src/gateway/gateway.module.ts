import { Module } from '@nestjs/common';
import { MessageGateway } from './gateway';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: Rol.name, schema: RolSchema },
    ]),
    HttpModule,
  ],
  providers: [MessageGateway],
})
export class GatewayModule {}
