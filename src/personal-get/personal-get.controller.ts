import {
  Controller,
  Get,
  HttpException,
  Param,
  Query,
  Res,
  Body,
} from '@nestjs/common';
import { PersonalGetService } from './personal-get.service';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import getConfig from '../config/configuration';
import { Response } from 'express';
import { PaginationDto } from 'src/common/pagination.dto';
import { number } from 'joi';

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

  // @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  // @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  @Get('paginate')
  async findAllPaginate(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.personalGetService.findAllPaginate(page, limit);
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
