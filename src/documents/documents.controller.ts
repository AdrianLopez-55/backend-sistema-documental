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
  ParseIntPipe,
  Res,
  UseGuards,
  BadRequestException,
  HttpException,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDTO } from './dto/updateDocument.dto';
import {
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
import { DocumentsFilter } from './dto/documents-filter.dto';
import { CustomErrorService } from 'src/error.service';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { AddWorkflowDocumentDto } from './dto/addWorkflowDocument.dto';
import { AddWorkflowSinCiDocumentDto } from './dto/addWorkflowSinCiDocument.dto';
import {
  DeriveDocumentEmployedDto,
  SendDocumentWithoutWorkflowDto,
} from './dto/sendDocumentWithoutWorkflow.dto';
import { LoggerInterceptor } from 'src/interceptors/loggerinterceptors';
import { EmailService } from 'src/email/email.service';
import { UnitysDto } from './dto/sendUnitysWithoutWorkflow.dto';
import { SendHtmlFileDto } from './dto/sendHtmlFile.dto';
import * as fs from 'fs';

@ApiTags('Documents')
@UseGuards(RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly sequenceService: SequenceService,
    private readonly customErrorService: CustomErrorService,
    private readonly emailService: EmailService,
  ) {}

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Post()
  @ApiOperation({
    summary: 'registry new document',
    description: 'this endpoint is used to register a new document',
  })
  async create(
    @Res() res: Response,
    @Body() createDocumentDTO: CreateDocumentDTO,
    @Req() request: Request,
    @Req() req,
  ) {
    try {
      const currentYear = new Date().getFullYear();
      const userId = req.user;
      const numberDocument =
        await this.sequenceService.getNextValueNumberDocument();

      if (createDocumentDTO.file.length < 0) {
        createDocumentDTO.file = null;
      }
      const newRegisterDocument = {
        ...createDocumentDTO,
        numberDocument,
        year: currentYear,
      };

      const newDocument = await this.documentsService.create(
        newRegisterDocument,
        userId,
      );

      res.send(newDocument);
      return newDocument;
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Post('create-multi-documents-with-workflow')
  async createMultiDocuments(@Req() req) {
    const userId = req.user;
    return this.documentsService.createMultiDocumentsWithWorkflow(userId);
  }

  /*

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Post('create-multi-documents-without-workflow')
  async createMultiDocumentsWithoutWorkflow(@Req() req) {
    const userId = req.user;
    return this.documentsService.createMultiDocumentswithoutWorkflow(userId);
  }

  */

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Post('create-multi-documents-on-hold')
  async createMultiDocumentsOnHold(@Req() req) {
    const userId = req.user;
    return this.documentsService.createMultiDocumentsOnHold(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Get()
  @ApiOperation({
    summary: 'see all documents or search by filters',
    description:
      'this endpoint is used to view all documents registered for all personnel.',
  })
  findAll() {
    return this.documentsService.findAll();
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  // @Get('documents-on-hold')
  // @ApiOperation({
  //   summary: 'see all documents that do not send anyone',
  //   description:
  //     'this endpoint is used to view all your documents that do not have a worklfow and have not yet been send to any other employee.',
  // })
  // async getAllDocumentsOnHold(@Req() req) {
  //   const userId = req.user;
  //   return this.documentsService.getDocumentsOnHold(userId);
  // }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('active')
  @ApiOperation({
    summary: 'see only documents actives',
    description:
      'this endpoint is used to view all documents of all personnel that have not been archived.',
  })
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
    @Req() req,
  ): Promise<Documents[]> {
    const query: any = { active: true };
    if (numberDocument) {
      query.numberDocument = numberDocument;
    }
    if (title) {
      query.title = title;
    }

    return this.documentsService.findDocumentsActive(query);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('paginacion')
  @ApiOperation({
    summary: 'get records by pagination',
    description:
      'Gets the records of documents by pagination all documentos from all personnel',
  })
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  async findAllPaginate(@Query() paginationDto: PaginationDto, @Req() req) {
    return this.documentsService.findAllPaginate(paginationDto);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('inactive')
  @ApiOperation({
    summary: 'see only documents inactives',
    description:
      'this endpoint is used to view all documents of all personnel that were archived or deleted.',
  })
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
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('filtrado')
  @ApiOperation({
    summary: 'Get records by parameter filtering',
    description: 'Search for records by filtering',
  })
  async filterParam(@Query() filter: DocumentsFilter) {
    return await this.documentsService.filterParams(filter);
  }

  /*
  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('recieved-without-workflow')
  @ApiOperation({
    summary: 'view all received documents directly without workflow',
    description:
      'this endpoint is used to view all documents received directly to your person without workflow.',
  })
  async getRecievedWithoutWorkflowDocument(@Req() req): Promise<Documents[]> {
    const userId = req.user;
    return this.documentsService.showRecievedDocumentWithouWorkflow(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  @Get('obtain-received-and-derived-documents')
  @ApiOperation({
    summary: 'view received and derived documents',
    description:
      'this endpoint is used to view all documents received and derived by your person and that follow a defined work flow.',
  })
  async getRecievedDocuments(
    @Query() paginationDto: PaginationDto,
    @Req() req,
  ) {
    const userId = req.user;
    return this.documentsService.showRecievedDocument(userId, paginationDto);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('obtain-documents-reviewed')
  @ApiOperation({
    summary: 'get all documents viewed for you',
  })
  async obtainDocumentsReviewed(@Req() req) {
    const userId = req.user;
    return this.documentsService.getDocumentsReviewed(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('obtain-multi-unity-document')
  async obtainMultiUnityDocument(@Req() req) {
    const userId = req.user;
    return this.documentsService.getRecievedDocumentsMultiUnitys(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('documents-send-without-workflow')
  @ApiOperation({
    summary: 'see all documentos send to other user without workflow',
    description:
      'this endpoint is used to view all documents send to other and other staff members but without defined worklfow',
  })
  async getDocumentsSendWithoutWorkflow(@Req() req) {
    const userId = req.user;
    return this.documentsService.showAllDocumentsSendWithoutWorkflow(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('obtain-documents-send-with-workflow')
  @ApiOperation({
    summary: 'see all documents send to other users using workflow',
    description:
      'this endpoint is used to view all documents send with a predefined worklfow, it is also used to track these documents.',
  })
  async getAllDocumentsSend(@Req() req) {
    const userId = req.user;
    return this.documentsService.showAllDocumentSend(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-documents-completed')
  @ApiOperation({
    summary: 'get documents completed',
    description:
      'This endpoint is used to view all your submitted documents that were completed',
  })
  async getDocumentsCompleted(@Req() req) {
    try {
      const userId = req.user;
      return this.documentsService.showAllDocumentsCompleted(userId);
    } catch (error) {}
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-documents-mark-completed')
  @ApiOperation({
    summary: 'get yours documents mark completed',
  })
  async getDocumentsMarkCompleted(@Req() req) {
    try {
      const userId = req.user;
      return this.documentsService.showDocumentsMarkComplete(userId);
    } catch (error) {
      throw new HttpException(`hubo un eror: ${error}`, 500);
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-documents-observed')
  @ApiOperation({
    summary: 'get documents observed',
    description: 'get all documents observed',
  })
  async getDocumentsObserved(@Req() req) {
    try {
      const userId = req.user;
      return this.documentsService.findDocumentsByUserIdAndObservation(userId);
    } catch (error) {}
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-documents-archived-user')
  @ApiOperation({
    summary: 'see all yours documents achived',
    description:
      'this endpoint is used to view all yours documents that were archived',
  })
  async getDocumetsArchivedUser(@Req() req) {
    const userId = req.user;
    return this.documentsService.findDocumentsArchivedUser(userId);
  }

  */

  //----------------------------------------------------------------------

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  @ApiQuery({
    name: 'view',
    type: String,
    example: 'EN ESPERA',
    required: false,
  })
  @ApiQuery({
    name: 'withWorkflow',
    type: String,
    example: 'true',
    required: false,
  })
  @Get('get-documents-lista-todo')
  async getDocuments(
    @Req() req,
    @Query() paginationDto: PaginationDto,
    @Query('view') view: string,
    @Query('withWorkflow') withWorkflow: string,
    @Query() filter: DocumentsFilter,
  ) {
    const userId = req.user;
    console.log('valor vista', view);
    return await this.documentsService.obtainDocuments(
      userId,
      view,
      withWorkflow,
      paginationDto,
      filter,
    );
  }

  //------------------------------------------------------------------

  /*
  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  @ApiQuery({
    name: 'view',
    type: String,
    example: 'DOCUMENTS ON HOLD',
    required: false,
  })
  @Get('get-all-table-paginate')
  async getAllTablePaginate(
    @Req() req,
    @Query() paginationDto: PaginationDto,
    @Query('view') view: string,
    @Query() filter: DocumentsFilter,
  ) {
    const userId = req.user;
    switch (view) {
      case 'DOCUMENTS ON HOLD':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'OBTAIN DOCUMENTS SEND WITH WORKFLOW':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'GET DOCUMENTS MARK COMPLETED':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'RECIEVED WITHOUT WORKFLOW':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'OBTAIN RECEIVED AND DERIVED DOCUMENTS':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'OBTAIN DOCUMENT REVIEWED':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'OBTAIN MULTI UNITY DOCUMENT':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'GET DOCUMENTS SEND WITHOUT WORKFLOW':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'GET DOCUMENTS COMPLETED':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'GET DOCUMENTS OBSERVED':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      case 'GET DOCUMENTS ARCHIVED USER':
        return this.documentsService.paginateAllTableDocuments(
          userId,
          paginationDto,
          view,
          filter,
        );
      default:
        return await this.documentsService.findAllPaginate(paginationDto);
    }
  }
  */

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'search document by id',
    description:
      'this endpoint is used to search for any document by its document ID',
  })
  async findOneUserDoc(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req,
    active: boolean,
  ) {
    try {
      const userId = req.user;
      const document = await this.documentsService.findOne(id, userId);
      return document;
    } catch (error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new BadRequestException('ID de documento inválido');
      }
      throw error;
    }
  }

  /*
  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-base64-document/:id')
  async getBase64Document(@Param('id') id: string) {
    return this.documentsService.getBase64Documents(id);
  }
  

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-base64-template-document/:id')
  async getBase64TemplateDocument(@Param('id') id: string) {
    return this.documentsService.showBase64TemplateDoc(id);
  }*/

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-documents-user/:userId')
  @ApiOperation({
    summary: 'view all documents owned by a user by their ID',
    description:
      'this endpoint is used to search for all documents held by a staff member using his or her ID',
  })
  async getAllDocumentByUserId(
    @Req() req,
    @Param('userId') userId: string,
  ): Promise<Documents[]> {
    try {
      return this.documentsService.getDocumentByUserId(userId);
    } catch (error) {
      throw new Error(error);
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('send-email/:id')
  async sendEmail(@Param('documentId') documentId: string) {
    // Lógica para obtener la dirección de correo electrónico del usuario destinatario
    const userEmail = 'adriplev@gmail.com'; // Debes obtener la dirección de correo electrónico del usuario de alguna manera

    // Datos para el correo electrónico
    const subject = 'Nuevo documento enviado';
    const text = 'Has recibido un nuevo documento.';

    // Envía el correo electrónico
    await this.emailService.sendEmail(userEmail, subject, text);

    return 'Correo electrónico enviado con éxito';
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('versions/:id/:version')
  @ApiOperation({
    summary: 'show the varsion a choise from documento',
    description:
      'this endpoint is used to search for previous versions of any document.',
  })
  async getDocumentVersion(
    @Req() req,
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
  ): Promise<Documents> {
    return this.documentsService.getDocumentVersion(id, version);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Put(':id')
  @ApiOperation({
    summary: 'update document by id',
    description:
      'this endpoint is used to update any document by means of its id',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDTO: UpdateDocumentDTO,
    @Req() req,
  ) {
    const userId = req.user;
    return this.documentsService.update(id, updateDocumentDTO);
  }

  /*

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Put(':id')
  @ApiOperation({
    summary: 'update document by id',
    description:
      'this endpoint is used to update any document by means of its id',
  })
  async updateUserDoc(
    @Param('id') id: string,
    @Body() updateDocumentDTO: UpdateDocumentDTO,
    @Req() req,
  ) {
    const userId = req.user;
    return this.documentsService.update(id, updateDocumentDTO, userId);
  }

  */

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Delete('inactive/:id')
  @ApiOkResponse({ description: 'document converted to inactive successfully' })
  @ApiNotFoundResponse({ description: 'document not found or not exist' })
  @ApiOperation({ summary: 'assign a document record to inactive using id' })
  async deleteDocument(@Param('id') id: string, active: boolean) {
    return this.documentsService.inactiverDocument(id, active);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Put('active/:id')
  @ApiOperation({ summary: 'reactivate a document record' })
  async reactiverDocument(@Param('id') id: string, active: boolean) {
    return this.documentsService.activerDocument(id, active);
  }

  @Post('generate-pdf')
  // @ApiBody({ description: 'Contenido HTML' })
  async generatePdf(
    @Body() sendHtmlFileDto: SendHtmlFileDto,
    // @Res() res: Response,
  ) {
    const pdfBase64 = await this.documentsService.htmlConvertPdf(
      sendHtmlFileDto,
    );
    const binaryData = Buffer.from(pdfBase64.pdfBase64, 'base64');

    const path = require('path');
    const tempFolder = path.join(process.cwd(), 'template');
    const fileName = `${pdfBase64.nameFile}.pdf`;
    const filePathPdf = path.join(tempFolder, fileName);
    fs.writeFileSync(filePathPdf, binaryData);

    const timeToLiveInMilliseconds = 1 * 60 * 1000;
    setTimeout(() => {
      fs.unlink(filePathPdf, (err) => {
        if (err) {
          console.error('error al eliminar el pdf: ', err);
        } else {
          console.log('Archivo pdf eliminado');
        }
      });
    }, timeToLiveInMilliseconds);

    //descarcarg el pdf
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    // const fileStream = fs.createReadStream(filePathPdf);
    // fileStream.pipe(res);
    return pdfBase64;
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('send-document-employeeds/:id')
  @ApiOperation({ summary: 'send a document a specific employeed' })
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
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('send-document-unity/:id')
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
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('send-document-without-workflow/:id')
  @ApiOperation({ summary: 'send document directly without workflow' })
  async sendDocumentWithoutWorkflow(
    @Param('id') documentId: string,
    @Body() sendDocumentWithoutWorkflowDto: SendDocumentWithoutWorkflowDto,
    @Req() req,
  ) {
    try {
      const userId = req.user;
      const { ci } = sendDocumentWithoutWorkflowDto;
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
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Post('send-document-multiple-units/:id')
  async sendDocumentMultipleUnits(
    @Param('id') documentId: string,
    @Body() unitysDto: UnitysDto,
    @Req() req,
  ) {
    try {
      const userId = req.user;
      const unitys = unitysDto.unitys;
      return this.documentsService.sendDocumentMultiUnitysWithoutWorkflow(
        documentId,
        unitys,
        userId,
      );
    } catch (error) {}
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('derive-document-employeed/:id')
  @ApiOperation({ summary: 'send a document a specific employeed' })
  async derivateDocumentWithCi(
    @Param('id') id: string,
    @Body() deriveDocumentEmployedDto: DeriveDocumentEmployedDto,
    @Req() req,
  ): Promise<Documents> {
    try {
      const { ci } = deriveDocumentEmployedDto;
      const userId = req.user;
      return this.documentsService.derivarDocumentWithCi(id, ci, userId);
    } catch (error) {
      throw new Error(error);
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('derive-document-unity-all/:id')
  @ApiOperation({ summary: 'derive document all employee unity' })
  async derivateDocumentAll(
    @Param('id') id: string,
    @Req() req,
  ): Promise<Documents> {
    const userId = req.user;
    return this.documentsService.derivarDocumentAll(id, userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('mark-document-observed/:id/:paso')
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
    @Param('paso') numberPaso: number,
    @Body() data: { motivo: string },
    @Req() req,
  ): Promise<Documents> {
    try {
      const { motivo } = data;
      const userId = req.user;
      return this.documentsService.selectPasoAnterior(
        id,
        numberPaso,
        motivo,
        userId,
      );
    } catch (error) {
      throw new HttpException('algo salio mal' + error, 500);
    }
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('mark-document-reviewed/:id')
  @ApiOperation({
    summary: 'mark document completed',
    description:
      'This endpoint is used to mark a document that has completed its workflow.',
  })
  async markDocumentReviewed(@Param('id') id: string, @Req() req) {
    const userId = req.user;
    return this.documentsService.markDocumentReviewed(id, userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('mark-document-completed/:id')
  @ApiOperation({
    summary: 'mark document completed',
    description:
      'This endpoint is used to mark a document that has completed its workflow.',
  })
  async markDocumentCompleted(@Param('id') id: string, @Req() req) {
    const userId = req.user;
    return this.documentsService.markDocumentcompleted(id, userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('comment/:id')
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
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @UseInterceptors(LoggerInterceptor)
  @Post('milestone/:id')
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
