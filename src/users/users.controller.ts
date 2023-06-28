// import { Body, Controller, Delete, Get, Param, Patch, Post, HttpCode, Req } from '@nestjs/common';
// import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import { Request } from 'express';
// import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';


// @Controller('users')
// export class UsersController {

// 	constructor(private readonly userService:UsersService){}
	
// 	@Post()
// 	@ApiOperation({
// 		summary: 'crear nuevo usuario',
// 	  })
// 	create(@Body() createUserDto: CreateUserDto){
// 		return this.userService.create(createUserDto);
// 	}

// 	@Get()
// 	@ApiOperation({
// 		summary: 'ver todos los usuarios creados',
// 	})
// 	@HttpCode(200)
// 	findAll(@Req() request: Request){
// 		return this.userService.findAll(request);
// 	}

// 	@Get(':id')
// 	@ApiOperation({
// 		summary: 'ver un documento especifico creados',
// 	  })
// 	findOne(@Param('id', ) id: string){
// 		return this.userService.findOne(id);
// 	}

// 	@Patch(':id')
// 	@ApiOperation({
// 		summary: 'actuaizar un documento',
// 	  })
// 	update(@Param("id") id: string, @Body() updateDocumentDTO: UpdateUserDto){
// 		return this.userService.update(id, updateDocumentDTO)
// 	}

// 	@Delete(':id')
// 	@ApiOperation({
// 		summary: 'eliminar un documento creado',
// 	})
// 	remove(@Param('id') id: string){
// 		return this.userService.remove(id);
// 	}
// }
