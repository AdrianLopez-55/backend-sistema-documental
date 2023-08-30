import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Step, StepSchema } from './schemas/step.schema';
import { StepService } from './step.service';
import { StepController } from './step.controller';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Step.name, schema: StepSchema },
      { name: Rol.name, schema: RolSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
    HttpModule,
  ],
  providers: [StepService],
  exports: [StepService],
  controllers: [StepController],
})
export class StepModule {}
