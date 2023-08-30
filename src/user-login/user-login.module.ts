import { Module } from '@nestjs/common';
import { UserLoginController } from './user-login.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import { HttpModule } from '@nestjs/axios';
import { UserLoginService } from './user-login.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: Rol.name, schema: RolSchema },
    ]),
    HttpModule,
  ],
  exports: [UserLoginService],
  providers: [UserLoginService],
  controllers: [UserLoginController],
})
export class UserLoginModule {}
