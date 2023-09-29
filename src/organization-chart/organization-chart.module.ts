import { Module } from '@nestjs/common';
import { OrganizationChartService } from './organization-chart.service';
import { OrganizationChartController } from './organization-chart.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { Step, StepSchema } from 'src/step/schemas/step.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Step.name, schema: StepSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Rol.name, schema: RolSchema },
    ]),
    HttpModule,
  ],
  controllers: [OrganizationChartController],
  providers: [OrganizationChartService],
})
export class OrganizationChartModule {}
