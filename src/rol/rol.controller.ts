import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SetPermissionToRolDto } from './dto/permission.rol';
import { Request } from 'express';
import { Rol } from './schema/rol.schema';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';

@Controller('rol')
@UseGuards(RolesGuard)
@ApiTags('rol')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'create a new role' })
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolService.createNewRol(createRolDto);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'obtain all rol' })
  async findAll() {
    return await this.rolService.sowAllRols();
  }

  @Get('filter')
  @ApiOperation({
    summary: 'Get records by parameter filtering',
    description: 'Search for records by filtering',
  })
  @ApiQuery({
    name: 'rolName',
    example: 'admin',
    required: false,
    description: 'search rol by name',
  })
  async filterParam(
    @Query('rolName') rolName: string,
    @Req() request: Request,
  ) {
    return this.rolService.filterParams(request);
  }

  @Get('active')
  @ApiOperation({ summary: 'see only rol actives' })
  async findRolActives(): Promise<Rol[]> {
    return this.rolService.findRolActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'get roll by id' })
  async findOne(@Param('id') id: string) {
    return await this.rolService.getRolbyId(id);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'update rol by id' })
  async update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto) {
    return await this.rolService.updateRol(id, updateRolDto);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put('set-perission-to-rol/:id')
  @ApiOperation({
    summary: 'set permissions to a role using role id and permission name',
  })
  async setPermissionToRol(
    @Param('id') id: string,
    @Body() setPermissionObject: SetPermissionToRolDto,
  ) {
    return await this.rolService.setPermission(id, setPermissionObject);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'inactivate a role by id' })
  async remove(@Param('id') id: string, activeRol: boolean) {
    return this.rolService.deleteRol(id, activeRol);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put(':id/activer')
  @ApiOperation({ summary: 'reactivate rol by id' })
  activeRol(@Param('id') id: string, activeRol: boolean) {
    return this.rolService.activerRol(id, activeRol);
  }
}
