import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EstadoUbicacionService } from './estado-ubicacion.service';
import { CreateEstadoUbicacionDto } from './dto/create-estado-ubicacion.dto';
import { UpdateEstadoUbicacionDto } from './dto/update-estado-ubicacion.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination.dto';
import { EstadoUbicacionFilter } from './dto/filter.dto';

@ApiTags('estado-ubicacion')
@Controller('estado-ubicacion')
export class EstadoUbicacionController {
  constructor(
    private readonly estadoUbicacionService: EstadoUbicacionService,
  ) {}

  @Get()
  findAll() {
    return this.estadoUbicacionService.findAll();
  }

  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  @Get('get-estado-ubicacion-table')
  async getStadoUbicacionTable(
    @Query() filter: EstadoUbicacionFilter,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.estadoUbicacionService.getUbicationState(
      filter,
      paginationDto,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.estadoUbicacionService.findOne(id);
  }
}
