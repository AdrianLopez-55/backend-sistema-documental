import { Controller, Get, Param, HttpException } from '@nestjs/common';
import { OrganizationChartService } from './organization-chart.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('organization-chart')
@ApiTags('external-organization-chart-data')
export class OrganizationChartController {
  constructor(
    private readonly organizationChartService: OrganizationChartService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtain all organization chart' })
  public async findAll(): Promise<any> {
    const url = `${process.env.API_ORGANIZATION_CHART_MAIN}`;
    try {
      const data = await this.organizationChartService.findAll(url);
      return data;
    } catch (error) {
      return 'Error al obtener datos del servicio organization chart';
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtain organization chart from id' })
  async getOrganigramaId(@Param('id') id: string) {
    const organigrama = await this.organizationChartService.findById(id);
    return organigrama;
  }

  @Get('get-organigrama-name/:name')
  @ApiOperation({ summary: 'get organigrama by name' })
  async getOrganigramaByName(@Param('name') name: string): Promise<any> {
    console.log('entraasasas');
    try {
      console.log('entraasasas');
      const data = await this.organizationChartService.findByName(name);
      return data;
    } catch (error) {
      // console.log(error);
      // throw new HttpException('error al obtener datos', 500);
    }
  }
}
