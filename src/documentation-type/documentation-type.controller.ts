import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  Query,
  Req
} from '@nestjs/common';
import { DocumentationTypeService } from './documentation-type.service';
import { CreateDocumentationTypeDto } from './dto/create-documentation-type.dto';
import { UpdateDocumentationTypeDto } from './dto/update-documentation-type.dto';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DocumentationType } from './schema/documentation-type.schema';
import { Request, Response } from 'express';
import { DocumentationTypeFilter } from './dto/documentType-filter.dto';

@Controller('documentation-type')
@ApiTags('documentation-type')
export class DocumentationTypeController {
  constructor(
    private readonly documentationTypeService: DocumentationTypeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new documentation type' })
  create(@Body() createDocumentationTypeDto: CreateDocumentationTypeDto) {
    const newDocumentationType = this.documentationTypeService.create(
      createDocumentationTypeDto,
    );
    return newDocumentationType;
    
  }

  @Get()
  @ApiOperation({ summary: 'see all documentation type in the database' })
  @ApiOkResponse({ description: 'document Types finds in the database' })
  @ApiNotFoundResponse({ description: 'documentation Type not founds' })
  findAll() {
    return this.documentationTypeService.findAll();
  }
  
  @Get('filtrado')
  @ApiOperation({ summary: 'Get records by parameter filtering', description: 'Search for records by filtering'})
  async filterParam(
    @Query() filter: DocumentationTypeFilter,
  ){
    console.log(filter.typeName)
    return await this.documentationTypeService.filterParams(filter)
  }

  @Get('active')
  @ApiOperation({ summary: 'see only document type actives' })
  async findDocumentTypeActive():Promise<DocumentationType[]>{
    return this.documentationTypeService.findDocumentsTypeActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'see documentation type in the database by ID' })
  findOne(@Param('id') id: string) {
    return this.documentationTypeService.findOne(id);
  }

  @Get('document-type/:typeName')
  @ApiOperation({ summary: 'search document type by name' })
  async getDocumentTypeByName(
    @Param('typeName') typeName: string,
  ) {
    const documentType =
      await this.documentationTypeService.getDocumentatioTypeByName(typeName);
      if (!documentType) {
        throw new HttpException('tipo de documentacion no encontrado', 404);
      }
    return documentType;
  }



  @Put(':id')
  @ApiOperation({ summary: 'update document by ID' })
  update(
    @Param('id') id: string,
    @Body() updateDocumentationTypeDto: UpdateDocumentationTypeDto,
  ) {
    return this.documentationTypeService.update(id, updateDocumentationTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inactiver document type by ID' })
  remove(@Param('id') id: string, activeDocumentType: boolean) {
    return this.documentationTypeService.inactiverTypeDocument(
      id,
      activeDocumentType,
    );
  }

  @Put(':id/activer')
  @ApiOperation({ summary: 'reactivate document type by id' })
  activeTypeDocument(@Param('id') id: string, activeDocumentType: boolean) {
    return this.documentationTypeService.activerTypeDocument(
      id,
      activeDocumentType,
    );
  }
}
