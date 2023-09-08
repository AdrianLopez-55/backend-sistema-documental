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
@UseGuards(RolesGuard)
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

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'registry new document' })
  @ApiBadRequestResponse({ description: 'bad request response' })
  async create(
    @Res() res: Response,
    @Body() createDocumentDTO: CreateDocumentDTO,
    @Req() request: Request,
    @Req() req,
  ) {
    try {
      //--------------------------------
      const currentYear = new Date().getFullYear();

      //------------------------------------------------------
      const userId = req.user;
      const numberDocument =
        await this.sequenceService.getNextValueNumberDocument();

      if (createDocumentDTO.file === '') {
        createDocumentDTO.file = null;
      }
      const newRegisterDocument = {
        ...createDocumentDTO,
        numberDocument,
        year: currentYear,
      };
      // res.send(newRegisterDocument);
      const newDocument = await this.documentsService.create(
        newRegisterDocument,
        userId,
      );
      // console.log(newDocument);
      res.send(newDocument);
      // return this.documentsService.create(newRegisterDocument, userId);
      // return newDocument;
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get()
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

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('documents-on-hold')
  @ApiOperation({ summary: 'see all documents that do not send anyone' })
  async getAllDocumentsOnHold(@Req() req) {
    const userId = req.user;
    return this.documentsService.getDocumentsOnHold(userId);
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Permissions(Permission.USER)
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Permissions(Permission.USER)
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

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('recieved-without-workflow')
  @ApiOperation({
    summary: 'view all received documents directly without workflow',
  })
  async getRecievedWithoutWorkflowDocument(@Req() req): Promise<Documents[]> {
    const userId = req.user;
    return this.documentsService.showRecievedDocumentWithouWorkflow(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('get-recieved-documents')
  @ApiOperation({ summary: 'view received documents' })
  async getRecievedDocuments(@Req() req): Promise<Documents[]> {
    const userId = req.user;
    return this.documentsService.showRecievedDocument(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('documents-send-without-workflow')
  @ApiOperation({
    summary: 'see all documentos send to other user without workflow',
  })
  async getDocumentsSendWithoutWorkflow(@Req() req) {
    const userId = req.user;
    return this.documentsService.showAllDocumentsSendWithoutWorkflow(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('get-all-documents-send')
  @ApiOperation({ summary: 'see all documents send to other users' })
  async getAllDocumentsSend(@Req() req) {
    const userId = req.user;
    return this.documentsService.showAllDocumentSend(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
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
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    active: boolean,
    @Req() req,
    // @Res() response: Response,
  ) {
    try {
      // const userId = req.user;
      const document = await this.documentsService.findOne(id);
      return this.documentsService.findOne(id);
    } catch (error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new BadRequestException('ID de documento inválido');
      }
      throw error;
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get(':userId/get-documents-user')
  @ApiOperation({ summary: 'view all documents owned by a user by their ID' })
  async getAllDocumentByUserId(
    @Req() req,
    @Param('userId') userId: string,
  ): Promise<Documents[]> {
    const userIdData = req.user;
    userId = userIdData;
    return this.documentsService.getDocumentByUserId(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Delete(':id/inactive')
  @ApiOkResponse({ description: 'document converted to inactive successfully' })
  @ApiNotFoundResponse({ description: 'document not found or not exist' })
  @ApiOperation({ summary: 'assign a document record to inactive using id' })
  async deleteDocument(@Param('id') id: string, active: boolean) {
    return this.documentsService.inactiverDocument(id, active);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put(':id/active')
  @ApiOperation({ summary: 'reactivate a document record' })
  async reactiverDocument(@Param('id') id: string, active: boolean) {
    return this.documentsService.activerDocument(id, active);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/sent-document-employeeds')
  @ApiOperation({ summary: 'sent a document a specific employeed' })
  async enviarDocumento(
    @Param('id') documentId: string,
    @Body() addWorkflowDocumentDto: AddWorkflowDocumentDto,
    @Req() req,
  ): Promise<Documents> {
    try {
      const userId = req.user;
      const document = this.documentsService.enviarDocument(
        documentId,
        addWorkflowDocumentDto,
        userId,
      );
      return document;
    } catch (error) {
      throw new HttpException(
        `no se pudo enviar documento, error: ${error}`,
        500,
      );
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/sent-document-unity')
  @ApiOperation({ summary: 'send a document to all employees of the unit' })
  async sendDocumentUnity(
    @Param('id') documentId: string,
    @Req() req,
    @Body() addWorkflowSinCiDocumentDto: AddWorkflowSinCiDocumentDto,
  ): Promise<Documents> {
    try {
      const userId = req.user;
      return this.documentsService.sendDocumentToUnity(
        documentId,
        addWorkflowSinCiDocumentDto,
        userId,
      );
    } catch (error) {
      throw new HttpException(`algo salio mal ${error}`, 500);
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/send-document-without-workflow')
  @ApiOperation({ summary: 'send document directly without workflow' })
  async sendDocumentWithoutWorkflow(
    @Param('id') documentId: string,
    @Body() ci: string[],
    @Req() req,
  ) {
    try {
      const userId = req.user;
      return this.documentsService.sendDocumentSinWorkflow(
        documentId,
        ci,
        userId,
      );
    } catch (error) {
      throw new HttpException('no se pudo enviar', 500);
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/derive-document-employeed')
  @ApiOperation({ summary: 'sent a document a specific employeed' })
  @ApiBody({
    description: 'Array of CI numbers of employees to send the document to.',
    type: [String],
  })
  async derivateDocumentWithCi(
    @Param('id') id: string,
    @Body() ci: string[],
    @Req() req,
  ): Promise<Documents> {
    try {
      const userId = req.user;
      return this.documentsService.derivarDocumentWithCi(id, ci, userId);
    } catch (error) {
      throw new Error(error);
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/derive-document-unity-all')
  @ApiOperation({ summary: 'derive document all employee unity' })
  async derivateDocumentAll(
    @Param('id') id: string,
    @Req() req,
  ): Promise<Documents> {
    const userId = req.user;
    return this.documentsService.derivarDocumentAll(id, userId);
  }

  @ApiBearerAuth()
  // @Permissions(Permission.USER)
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

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/comment')
  @ApiOperation({
    summary: 'add dates from commnet document',
  })
  @ApiOkResponse({ description: 'add comment into de document corectly' })
  async addComment(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req,
    @Body() comment: CreateCommentDto,
  ) {
    const userId = req.user;
    return this.documentsService.addComment(id, comment, userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':id/milestone')
  @ApiOperation({
    summary: 'add milestone for documento',
  })
  @ApiOkResponse({ description: 'milestones add into de document correctly' })
  async addMIlestone(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req,
    @Body() milestone: CreateMilestoneDto,
  ) {
    const userId = req.user;
    return this.documentsService.addMilestones(id, milestone, userId);
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
