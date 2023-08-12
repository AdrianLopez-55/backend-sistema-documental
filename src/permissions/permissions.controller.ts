// import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Query, Req } from '@nestjs/common';
// import { PermissionsService } from './permissions.service';
// import { CreatePermissionDto } from './dto/create-permission.dto';
// import { UpdatePermissionDto } from './dto/update-permission.dto';
// import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
// import { Permission } from './schemas/permission.schema';


// @Controller('permissions')
// @ApiTags('Permissions')
// export class PermissionsController {
//   constructor(private readonly permissionsService: PermissionsService) {}

//   @Post()
//   create(@Body() createPermissionDto: CreatePermissionDto) {
//     return this.permissionsService.create(createPermissionDto);
//   }

//   @Get()
//   findAll() {
//     return this.permissionsService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.permissionsService.findOne(id);
//   }

//   // @Get('active')
// 	// @ApiQuery({name: 'name', example: 'Permiso_1', required: false, description: 'search permission by your name'})
// 	// async findDocumentActive(): Promise<Permission[]>{
// 	// 		const query: any = { active: true };
// 	// 		// if(name) {
// 	// 		// 	query.name = name
// 	// 		// }
// 	// 	return this.permissionsService.findDocumentsActive(query)
// 	// } 

//   // @Get('active')
//   // async getActivePermissions(): Promise<Permission[]>{
//   //   return this.permissionsService.findPermissionActive();
//   // }

//   @Put(':id')
//   update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
//     return this.permissionsService.update(id, updatePermissionDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string, active: boolean) {
//     return this.permissionsService.inactiverPermission(id, active);
//   }
// }
