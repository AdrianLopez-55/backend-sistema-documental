import { Controller, Get, Param } from '@nestjs/common';
import { OrganizationChartService } from './organization-chart.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('organization-chart')
@ApiTags('external-organization-chart-data')
export class OrganizationChartController {
  constructor(private readonly organizationChartService: OrganizationChartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtain all organization chart'})
  public async findAll(): Promise<any> {
    const url = `${process.env.API_ORGANIZATION_CHART_MAIN}`
    try {
      const data = await this.organizationChartService.findAll(url)
      return data;
    } catch (error){
      return 'Error al obtener datos del servicio organization chart'
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtain organization chart from id'})
  async getOrganigramaId(@Param('id') id: string){
    const organigrama = await this.organizationChartService.findById(id);
    return organigrama;
  }
}
