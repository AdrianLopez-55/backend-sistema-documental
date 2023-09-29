// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   Query,
//   HttpException,
//   Put,
// } from '@nestjs/common';
// import { StateDocumentService } from './state-document.service';
// import { CreateStateDocumentDto } from './dto/create-state-document.dto';
// import { UpdateStateDocumentDto } from './dto/update-state-document.dto';
// import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import { filter } from 'rxjs';
// import { StateDocumentFilter } from './dto/state-documentFilter.dto';
// import { ParseObjectIdPipe } from 'src/utilities/parse-object-id-pipe.pipe';

// @Controller('state-document')
// @ApiTags('state-document')
// export class StateDocumentController {
//   constructor(private readonly stateDocumentService: StateDocumentService) {}

//   @Post()
//   @ApiOperation({
//     summary: 'create a new state document',
//     description: 'This endpoint is used to create a new state of the document',
//   })
//   async create(@Body() createStateDocumentDto: CreateStateDocumentDto) {
//     return this.stateDocumentService.create(createStateDocumentDto);
//   }

//   @Get()
//   @ApiOperation({
//     summary: 'find all state document activated',
//     description: 'This endpoint is used to find all state of the document',
//   })
//   findAll() {
//     return this.stateDocumentService.findAll();
//   }

//   @Get('filtrado')
//   @ApiOperation({
//     summary: 'find state document by filtered',
//     description: 'This endpoint is used to find document statuses by filtering',
//   })
//   async filterStateDocument(@Query() filter: StateDocumentFilter) {
//     return await this.stateDocumentService.filterParams(filter);
//   }

//   @Get('inactive')
//   @ApiOperation({
//     summary: 'find state document inactived',
//     description: 'This endpoint is used to find document statuses inactived',
//   })
//   async findStateDocumentInactive() {
//     return await this.stateDocumentService.findAllInactive();
//   }

//   @Get(':id')
//   @ApiOperation({
//     summary: 'obtain state documento by ID',
//     description: 'this endpoint is used to find a state documento by ID',
//   })
//   async findOne(@Param('id', ParseObjectIdPipe) id: string) {
//     try {
//       const stateDocument = await this.stateDocumentService.findOne(id);
//       return stateDocument;
//     } catch (error) {
//       throw new Error(`algo salio mal: ${error}`);
//     }
//   }

//   @Put(':id')
//   update(
//     @Param('id') id: string,
//     @Body() updateStateDocumentDto: UpdateStateDocumentDto,
//   ) {
//     return this.stateDocumentService.update(id, updateStateDocumentDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.stateDocumentService.remove(id);
//   }

//   @Put('activer/:id')
//   @ApiOperation({
//     summary: 'activer state document with ID',
//     description: 're-activer a state document with ID',
//   })
//   activerStateDocument(@Param('id') id: string) {
//     return this.stateDocumentService.activerStateDocument(id);
//   }
// }
