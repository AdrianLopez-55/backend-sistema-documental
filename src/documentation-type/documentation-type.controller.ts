import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpException,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentationTypeService } from './documentation-type.service';
import { CreateDocumentationTypeDto } from './dto/create-documentation-type.dto';
import { UpdateDocumentationTypeDto } from './dto/update-documentation-type.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DocumentationType } from './schema/documentation-type.schema';
import { DocumentationTypeFilter } from './dto/documentType-filter.dto';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { RolesGuard } from 'src/guard/roles.guard';
// import { LoggerInterceptor } from '../interceptors/loggerInterceptors';
import { PaginationDto } from 'src/common/pagination.dto';

@Controller('documentation-type')
// @UseGuards(RolesGuard)
@ApiTags('documentation-type')
export class DocumentationTypeController {
  constructor(
    private readonly documentationTypeService: DocumentationTypeService,
  ) {}

  // @ApiBearerAuth()
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Post()
  @ApiOperation({ summary: 'Create a new documentation type' })
  async create(@Body() createDocumentationTypeDto: CreateDocumentationTypeDto) {
    const newDocumentationType = await this.documentationTypeService.create(
      createDocumentationTypeDto,
    );
    return newDocumentationType;
  }

  @Get('active')
  @ApiOperation({ summary: 'see only document type actives' })
  async findDocumentTypeActive(): Promise<DocumentationType[]> {
    return this.documentationTypeService.findDocumentsTypeActive();
  }

  @Get('pagination')
  @ApiOperation({
    summary: 'get dcumentation types by pagination',
  })
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  @ApiQuery({
    name: 'startDate',
    type: Date,
    example: '2023-11-01',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: Date,
    required: false,
  })
  async findAllPaginate(
    @Query() filter: DocumentationTypeFilter,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Req() req,
  ) {
    const dateRange = { startDate, endDate };
    return this.documentationTypeService.findAllPaginate(filter, dateRange);
  }

  @Get(':id')
  @ApiOperation({ summary: 'see documentation type in the database by ID' })
  findOne(@Param('id') id: string) {
    return this.documentationTypeService.findOne(id);
  }

  // @Get('base64Docx/:id')
  // async base64Docx(@Param('id') id: string) {
  //   return this.documentationTypeService.getBase64Template(id);
  // }

  // @ApiBearerAuth()
  // @Permissions(Permission.USER)
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  @Get('document-type/:typeName')
  @ApiOperation({ summary: 'search document type by name' })
  async getDocumentTypeByName(@Param('typeName') typeName: string) {
    const documentType =
      await this.documentationTypeService.getDocumentatioTypeByName(typeName);
    if (!documentType) {
      throw new HttpException('tipo de documentacion no encontrado', 404);
    }
    return documentType;
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Put(':id')
  @ApiOperation({ summary: 'update document by ID' })
  update(
    @Param('id') id: string,
    @Body() updateDocumentationTypeDto: UpdateDocumentationTypeDto,
  ) {
    return this.documentationTypeService.update(id, updateDocumentationTypeDto);
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Delete(':id')
  @ApiOperation({ summary: 'Inactiver document type by ID' })
  remove(@Param('id') id: string, activeDocumentType: boolean) {
    return this.documentationTypeService.inactiverTypeDocument(
      id,
      activeDocumentType,
    );
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Put('activer/:id')
  @ApiOperation({ summary: 'reactivate document type by id' })
  activeTypeDocument(@Param('id') id: string, activeDocumentType: boolean) {
    return this.documentationTypeService.activerTypeDocument(
      id,
      activeDocumentType,
    );
  }
}
