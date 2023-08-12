import { Module } from '@nestjs/common';
import { OrganizationChartService } from './organization-chart.service';
import { OrganizationChartController } from './organization-chart.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrganizationChartController],
  providers: [OrganizationChartService]
})
export class OrganizationChartModule {}
