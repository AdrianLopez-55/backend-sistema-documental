import { Controller, Get, HttpException, Param, Res } from '@nestjs/common';
import { PersonalGetService } from './personal-get.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import getConfig from '../config/configuration';
import { Response } from 'express';

@ApiTags('personal-get')
@Controller('personal-get')
export class PersonalGetController {
  constructor(private readonly personalGetService: PersonalGetService) {}

  @Get('get-personal-data-all')
  @ApiOperation({ summary: 'get all personal' })
  public async getExternalDataPersonal(@Res() res: Response): Promise<any> {
    const url = `${getConfig().api_personal_get}`;
    try {
      const data = await this.personalGetService.fetchDataFromPersonalServer(
        url,
      );
      res.send(data);
      return data;
    } catch (error) {
      throw new HttpException('error al obtener datos de personal', 404);
    }
  }

  @Get('get-personal-data-id/:id')
  @ApiOperation({ summary: 'get personal by ID' })
  public async getExternalDAtaById(
    @Param('id') personalId: string,
  ): Promise<any> {
    try {
      const data =
        await this.personalGetService.fetchDataFromPersonalServerById(
          personalId,
        );
      return data;
    } catch (error) {
      throw new HttpException('error al btener el id de personal', 404);
    }
  }

  @Get('get-personal-data-ci/:ci')
  @ApiOperation({ summary: 'get personal by ci' })
  async getPersonalCi(@Param('ci') ci: string): Promise<any> {
    try {
      const data =
        await this.personalGetService.fetchDataFromPersonalServerByCi(ci);
      return data;
    } catch (error) {
      throw new HttpException('error al obtener datos de personal con ci', 404);
    }
  }
}
