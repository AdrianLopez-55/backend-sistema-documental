import {
  Controller,
  Get,
  Param,
  HttpException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrganizationChartService } from './organization-chart.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import getConfig from '../config/configuration';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';

@Controller('organization-chart')
// @UseGuards(RolesGuard)
@ApiTags('external-organization-chart-data')
export class OrganizationChartController {
  constructor(
    private readonly organizationChartService: OrganizationChartService,
  ) {}

  // @ApiBearerAuth()
  // @Permissions(Permission.USER)
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'Obtain all organization chart' })
  public async findAll(@Request() req): Promise<any> {
    const url = `${getConfig().api_organization_chart_main}`;
    const tokenDat = req.token;
    try {
      const data = await this.organizationChartService.findAll(url, tokenDat);
      return data;
    } catch (error) {
      throw new Error(`error al obtener datos ${error}`);
    }
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.USER)
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Obtain organization chart from id' })
  async getOrganigramaId(@Param('id') id: string, @Request() req) {
    const tokenDat = req.token;
    const organigrama = await this.organizationChartService.findById(
      id,
      tokenDat,
    );
    return organigrama;
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.USER)
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  @Get('get-organigrama-name/:name')
  @ApiOperation({ summary: 'get organigrama by name' })
  async getOrganigramaByName(
    @Param('name') name: string,
    @Request() req,
  ): Promise<any> {
    console.log('entraasasas');
    const tokenDat = req.token;
    try {
      console.log('entraasasas');
      const data = await this.organizationChartService.findByName(
        name,
        tokenDat,
      );
      return data;
    } catch (error) {
      // console.log(error);
      // throw new HttpException('error al obtener datos', 500);
    }
  }
}
