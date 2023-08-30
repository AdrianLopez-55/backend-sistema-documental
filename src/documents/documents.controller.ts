import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Query,
  Put,
  ForbiddenException,
  ParseIntPipe,
  Res,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
  HttpException,
  HttpStatus,
  UploadedFile,
  Render,
  // Request,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDTO } from './dto/updateDocument.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateDocumentDTO } from './dto/createDocument.dto';
import { Request, Response, Express } from 'express';
import { ParseObjectIdPipe } from 'src/utilities/parse-object-id-pipe.pipe';
import { CreateCommentDto } from './dto/createComment.dto';
import { CreateMilestoneDto } from './dto/createMilestone.dto';
import { SequenceService } from './sequenceService.service';
import { PaginationDto } from '../common/pagination.dto';
import { Documents } from './schema/documents.schema';
import { ApiService } from 'src/ServiceApi/api.service';
import { User } from '../interfaces/user.interface';
import { FilterDto } from './dto/filter.dto';
import { HttpService } from '@nestjs/axios';
import { WorkflowService } from 'src/workflow/workflow.service';
import { Workflow } from 'src/workflow/schemas/workflow.schema';
import { LoggerMiddleware } from 'src/logger.middleware';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import * as handlebars from 'handlebars';
import * as pdfkit from 'pdfkit';
import * as PDFDocument from 'pdfkit';
import { UploadTextDto } from './dto/uploadText.dto';
import { NOTFOUND } from 'dns';
import { ResponseInterceptor } from './reponseData.interceptor';
import { updateWorkflowDocumentDto } from './dto/updateWorkflo..dtt';
import { DocumentsFilter } from './dto/documents-filter.dto';
import { CustomErrorService } from 'src/error.service';
import { RolesGuard } from 'src/guard/roles.guard';
// import { Permission } from 'src/permissions/schemas/permission.schema';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { UpdateSteDocumentDto } from './dto/updatesteDocument.dto';
import { AddWorkflowDocumentDto } from './dto/addWorkflowDocument.dto';
import { AddWorkflowSinCiDocumentDto } from './dto/addWorkflowSinCiDocument.dto';
// import { RolesGuard } from 'src/guard/roles.guard';

@ApiTags('Documents')
//---------rol user information---
// @UseGuards(RolesGuard)
//-------------------------------
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly sequenceService: SequenceService,
    private readonly apiService: ApiService,
    private readonly httpService: HttpService,
    private readonly workflowService: WorkflowService,
    private readonly customErrorService: CustomErrorService,
  ) {}

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'registry new document' })
  @ApiCreatedResponse({
    description: 'The document has been successfully created.',
    type: CreateDocumentDTO,
  })
  @ApiBadRequestResponse({ description: 'bad request response' })
  async create(
    @Res() res: Response,
    @Body() createDocumentDTO: CreateDocumentDTO,
    @Req() request: Request,
    @Req() req,
  ): Promise<Documents> {
    try {
      const userId = req.user;
      const numberDocument =
        await this.sequenceService.getNextValueNumberDocument();

      if (createDocumentDTO.file === '') {
        createDocumentDTO.file = null;
      }

      if (createDocumentDTO.title === '') {
        throw new Error('no se puso titulo');
      }
      // if (!createDocumentDTO.workflowName) {
      //   throw new HttpException('worflow no encontrado', 404);
      // }
      const newRegisterDocument = {
        ...createDocumentDTO,
        numberDocument,
      };

      const templatePath =
        'E:\\adrian carrera cosas\\TALLER DE GRADO 1 Y PRACTICA LABORAL (INTERNADO ROTATORIO)\\aplicacion-sistema-next\\back-documental-test\\src\\documents\\template-base.html';

      const templateSource = fs.readFileSync(templatePath, 'utf8');

      res.send(newRegisterDocument);
      return this.documentsService.create(newRegisterDocument, userId);
    } catch (error) {
      throw error;
    }
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get()
  // @ApiBearerAuth()
  @ApiOperation({
    summary: 'see all documents or search by filters',
  })
  @ApiNotFoundResponse({ description: 'The documents cant find' })
  @ApiOkResponse({ description: 'documents finds', type: CreateDocumentDTO })
  @ApiNotFoundResponse({ description: 'documents not founds' })
  findAll(@Req() request: Request, @Req() req) {
    // const userId = req.user;
    return this.documentsService.findAll();
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('get-recieved-documents')
  @ApiOperation({ summary: 'view received documents' })
  async getRecievedDocuments(@Req() req): Promise<Documents[]> {
    const userId = req.user;
    return this.documentsService.showRecievedDocument(userId);
  }

  @Get('get-all-documents-send')
  async getAllDocumentsSend() {
    return this.documentsService.showAllDocumentSend();
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('active')
  @ApiOperation({ summary: 'see only documents actives' })
  @ApiQuery({
    name: 'numberDocument',
    example: 'DOC-001',
    required: false,
    description: 'search document by numer document',
  })
  @ApiQuery({
    name: 'title',
    example: 'Gastos',
    required: false,
    description: 'search document by title',
  })
  async findDocumentActive(
    @Query('numberDocument') numberDocument: string,
    @Query('title') title: string,
    // @Req() request: Request,
    @Req() req,
  ): Promise<Documents[]> {
    const query: any = { active: true };
    if (numberDocument) {
      query.numberDocument = numberDocument;
    }
    if (title) {
      query.title = title;
    }
    // const userId = req.user;

    return this.documentsService.findDocumentsActive(query);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('paginacion')
  @ApiOperation({
    summary: 'get records by pagination',
    description: 'Gets the records of documents by pagination',
  })
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'offset', type: Number, example: 0, required: false })
  async findAllPaginate(@Query() paginationDto: PaginationDto, @Req() req) {
    console.log('entra');
    console.log(PaginationDto.length);
    // const userId = req.user;
    return this.documentsService.findAllPaginate(paginationDto);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('inactive')
  @ApiOperation({ summary: 'see only documents inactives' })
  @ApiQuery({
    name: 'numberDocument',
    example: 'DOC-001',
    required: false,
    description: 'search document by numer document',
  })
  @ApiQuery({
    name: 'title',
    example: 'Gastos',
    required: false,
    description: 'search document by title',
  })
  async findDocumentInactive(
    @Query('numberDocument') numberDocument: string,
    @Query('title') title: string,
    @Req() request: Request,
    @Req() req,
  ): Promise<Documents[]> {
    const query: any = { active: false };
    if (numberDocument) {
      query.numberDocument = numberDocument;
    }
    if (title) {
      query.title = title;
    }
    // const userId = req.user;
    return this.documentsService.findDocumentsInactive(query);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('filtrado')
  @ApiOperation({
    summary: 'Get records by parameter filtering',
    description: 'Search for records by filtering',
  })
  async filterParam(@Query() filter: DocumentsFilter) {
    return await this.documentsService.filterParams(filter);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'search document by id',
  })
  @ApiOkResponse({ description: 'document find' })
  @ApiNotFoundResponse({ description: 'document not found or not exist' })
  @ApiForbiddenResponse({
    description: 'document forbiden, document not use now',
  })
  // @UseInterceptors(ResponseInterceptor)
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    active: boolean,
    @Req() req,
    // @Res() response: Response,
  ) {
    try {
      // const userId = req.user;
      const document = await this.documentsService.findOne(id);
      // return document;
      return this.documentsService.findOne(id);
    } catch (error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new BadRequestException('ID de documento inválido');
      }
      throw error;
    }
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'show the varsion a choise from documento' })
  async getDocumentVersion(
    @Req() req,
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
  ): Promise<Documents> {
    // const userId = req.user;
    return this.documentsService.getDocumentVersion(id, version);
  }

  // @Get('create-docx')
  // async createDocx(): Promise<string> {
  //   this.documentsService.createDocx();
  //   return 'document created...';
  // }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'update document by id' })
  @ApiOkResponse({ description: 'document update correctly' })
  @ApiNotFoundResponse({ description: 'document not found' })
  @ApiForbiddenResponse({ description: 'document not use now' })
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDTO: UpdateDocumentDTO,
    @Req() req,
  ): Promise<Documents> {
    // const userId = req.user;
    const document = await this.documentsService.findOne(id);
    if (!document.active) {
      throw new ForbiddenException('documento inactivo');
    }
    return this.documentsService.update(id, updateDocumentDTO);
  }

  @Put('update-only-step-workflow/:id')
  @ApiOperation({
    summary:
      'update only one step in the workflow with number paso and name office',
  })
  async UpdateStepDocumentWorkflow(
    @Param('id') id: string,
    @Body() updateStepDocumentDto: UpdateSteDocumentDto,
  ) {
    return this.documentsService.updateWorkflowStep(id, updateStepDocumentDto);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Delete(':id/inactive')
  @ApiOkResponse({ description: 'document converted to inactive successfully' })
  @ApiNotFoundResponse({ description: 'document not found or not exist' })
  @ApiOperation({ summary: 'assign a document record to inactive using id' })
  async deleteDocument(@Param('id') id: string, active: boolean) {
    return this.documentsService.inactiverDocument(id, active);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put(':id/active')
  @ApiOperation({ summary: 'reactivate a document record' })
  async reactiverDocument(@Param('id') id: string, active: boolean) {
    return this.documentsService.activerDocument(id, active);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/sent-document-employeeds')
  @ApiOperation({ summary: 'sent a document a specific employeed' })
  // @ApiBody({
  //   description: 'Array of CI numbers of employees to send the document to.',
  //   type: [String],
  // })
  async enviarDocumento(
    @Param('id') documentId: string,
    @Body() addWorkflowDocumentDto: AddWorkflowDocumentDto,
  ): Promise<Documents> {
    try {
      return this.documentsService.enviarDocument(
        documentId,
        addWorkflowDocumentDto,
      );
    } catch (error) {
      throw error;
    }
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/sent-document-unity')
  @ApiOperation({ summary: 'send a document to all employees of the unit' })
  async sendDocumentUnity(
    @Param('id') documentId: string,
    @Body() addWorkflowSinCiDocumentDto: AddWorkflowSinCiDocumentDto,
  ): Promise<Documents> {
    try {
      return this.documentsService.sendDocumentToUnity(
        documentId,
        addWorkflowSinCiDocumentDto,
      );
    } catch (error) {
      throw new HttpException(`algo salio mal ${error}`, 500);
    }
  }

  @Post(':id/derive-document-employeed')
  @ApiOperation({ summary: 'sent a document a specific employeed' })
  @ApiBody({
    description: 'Array of CI numbers of employees to send the document to.',
    type: [String],
  })
  async derivateDocumentWithCi(
    @Param('id') id: string,
    @Body() ci: string[],
  ): Promise<Documents> {
    try {
      return this.documentsService.derivarDocumentWithCi(id, ci);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Post(':id/derive-document-unity-all')
  @ApiOperation({ summary: 'derive document all employee unity' })
  async derivateDocumentAll(@Param('id') id: string): Promise<Documents> {
    return this.documentsService.derivarDocumentAll(id);
  }

  // @Post('generate-pdf')
  // async generatePDF(@Req() req, @Res() res) {
  //   const { title, date } = req.body;
  //   const pdfBuffer = await this.documentsService.generatePDF(title, date);

  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader(
  //     'Content-Disposition',
  //     `attachment; filename=generated-document.pdf`,
  //   );
  //   res.send(pdfBuffer);
  // }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/:paso/numero-paso')
  @ApiOperation({ summary: 'return to a previous step in the workflow' })
  @ApiBody({
    type: String,
    description:
      'reason why you want to resend the document to the previous office, be direct',
    examples: {
      example: {
        value: {
          motivo: 'Revision',
        },
      },
    },
  })
  async volverPasoAnteior(
    @Param('id') id: string,
    @Param('paso') paso: number,
    @Body() data: { motivo: string },
  ): Promise<Documents> {
    try {
      const { motivo } = data;
      return this.documentsService.selectPasoAnterior(id, paso, motivo);
    } catch (error) {
      throw new HttpException('algo salio mal' + error, 500);
    }
  }

  @Post(':id/comment')
  @ApiOperation({
    summary: 'add dates from commnet document',
  })
  @ApiOkResponse({ description: 'add comment into de document corectly' })
  async addComment(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() comment: CreateCommentDto,
  ) {
    return this.documentsService.addComment(id, comment);
  }

  @Post(':id/milestone')
  @ApiOperation({
    summary: 'add milestone for documento',
  })
  @ApiOkResponse({ description: 'milestones add into de document correctly' })
  async addMIlestone(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() milestone: CreateMilestoneDto,
  ) {
    return this.documentsService.addMilestones(id, milestone);
  }
}

function enviarRespuesta(response, codigo, error, mensaje, data) {
  response.status(codigo).json({
    status: codigo,
    error: error,
    mensaje: mensaje,
    response: data,
  });
}
