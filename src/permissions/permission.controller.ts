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
import { PermissionsService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from '../guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { Request } from 'express';

@ApiTags('Permissions')
@UseGuards(RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'create a new permission' })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.ADMIN)
  @Get()
  @ApiOperation({ summary: 'get all permission' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiBearerAuth()
  @Permissions(Permission.CREAR_DOCUMENTO)
  @Get('permission-central')
  @ApiOperation({ summary: 'show permission of the user login' })
  async permissionCentral(@Req() req) {
    try {
      const permissionUserLogin = req.permissionUserLogin;
      console.log(
        'esto es permission user login controller',
        permissionUserLogin,
      );
      const filteredPermissions = permissionUserLogin.filter((permission) =>
        permission.permissionName.startsWith('GESTIONDOCUMENTAL_'),
      );
      return await this.permissionsService.viewPermissionCentral(
        filteredPermissions,
      );
    } catch (error) {}
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('filter')
  @ApiOperation({
    summary: 'Get records by parameter filtering',
    description: 'Search for records by filtering',
  })
  @ApiQuery({
    name: 'permissionName',
    example: 'permiso',
    required: false,
    description: 'search permission by name',
  })
  async filterparam(
    @Query('permissionName') permissionName: string,
    @Req() request: Request,
  ) {
    return this.permissionsService.filteParams(request);
  }

  // @Get('active')
  // @ApiOperation({ summary: 'see only permission active' })
  // async findPermissionActives():Promise<Permission[]>{
  //   const data = this.permissionsService.findAllActives();
  //   res.send
  // }

  @Get(':id')
  @ApiOperation({ summary: 'get permission by id' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  // @Get('active')
  // @ApiQuery({name: 'name', example: 'Permiso_1', required: false, description: 'search permission by your name'})
  // async findDocumentActive(): Promise<Permission[]>{
  // 		const query: any = { active: true };
  // 		// if(name) {
  // 		// 	query.name = name
  // 		// }
  // 	return this.permissionsService.findDocumentsActive(query)
  // }

  // @Get('active')
  // async getActivePermissions(): Promise<Permission[]>{
  //   return this.permissionsService.findPermissionActive();
  // }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'update permission by id' })
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'inactivate permission by id' })
  remove(@Param('id') id: string, active: boolean) {
    return this.permissionsService.inactiverPermission(id, active);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put('activer/:id')
  @ApiOperation({ summary: 'reactivate permission by id' })
  activerPermission(@Param('id') id: string, active: boolean) {
    return this.permissionsService.activerPermission(id, active);
  }
}
