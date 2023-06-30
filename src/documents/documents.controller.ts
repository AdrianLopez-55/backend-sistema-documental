import { Body, Controller, Delete, Get, Param, Patch, Post, HttpCode, HttpException, HttpStatus, Req, Query, Put, ForbiddenException, BadRequestException, NotFoundException, UseInterceptors, UploadedFile, ParseIntPipe, Res  } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDTO } from './dto/updateDocument.dto'
import { ApiAcceptedResponse, ApiBadGatewayResponse, ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConflictResponse, ApiConsumes, ApiCreatedResponse, ApiDefaultResponse, ApiForbiddenResponse, ApiFoundResponse, ApiGatewayTimeoutResponse, ApiGoneResponse, ApiInternalServerErrorResponse, ApiMethodNotAllowedResponse, ApiMovedPermanentlyResponse, ApiNoContentResponse, ApiNotAcceptableResponse, ApiNotFoundResponse, ApiNotImplementedResponse, ApiOkResponse, ApiOperation, ApiPayloadTooLargeResponse, ApiPreconditionFailedResponse, ApiQuery, ApiRequestTimeoutResponse, ApiResponse, ApiServiceUnavailableResponse, ApiTags, ApiTooManyRequestsResponse, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse, ApiUnsupportedMediaTypeResponse } from '@nestjs/swagger';
import { CreateDocumentDTO } from './dto/createDocument.dto';
import { Request, Response } from 'express';
import { ParseObjectIdPipe } from 'src/utilities/parse-object-id-pipe.pipe';
import { CreateCommentDto } from './dto/createComment.dto';
import { CreatePhysicalLocationDto } from './dto/createPhysicalLocation.dto';
import { CreateSignatureAprovedDto } from './dto/createSignatureAproved.dto';
import { CreateMilestoneDto } from './dto/createMilestone.dto';
import { badRequestDocDto } from './dto/responsesDto/documentResponse/badRequestDoc';
import { SequenceService } from './sequenceService.service';
import { PaginationDto } from 'src/common/pagination.dto';
import { Documents } from './schema/documents.schema';
import { version } from 'os';
import { Base64DocumentResponseDTO } from 'src/base64-document/dto/base64-document-response.dto';
import { PersonalService } from 'src/personal/personal.service';
import { BadRequestError } from 'passport-headerapikey';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { Express } from 'express';

	@Controller('documents')
	@ApiTags('Registry Documents')
	export class DocumentsController {

	constructor(
		private readonly documentsService:DocumentsService, 
		private readonly sequenceService: SequenceService){}

	@Post()
	// @ApiConsumes('multipart/form-data')
	// @ApiConsumes('application/json')
	// @UseInterceptors(FileInterceptor('file'))
	@ApiOperation({summary: 'registry new document'})
	@ApiCreatedResponse({ description: 'The document has been successfully created.', type: CreateDocumentDTO})
	@ApiBadRequestResponse({description: 'bad request response', type: badRequestDocDto})
	async create(@Res() res: Response, @Body() createDocumentDTO: CreateDocumentDTO){
		
		try{
		const numberDocument = await this.sequenceService.getNextValueNumberDocument();
		
		// const response = await this.documentsService.filesUploader(createDocumentDTO, res);
		// console.log(response);



		// try{
		// 	// const { personalId } = createDocumentDTO;
		// 	const personalData = await this.documentsService.getPersonalId(personalData).toPromise();
		// 	if(!personalData){
		// 		throw new Error('no se enontro personal')
		// 	}
		// 	const document = new dcu
		// }
		if(createDocumentDTO.file === ""){
			createDocumentDTO.file = null
		}


		const newRegisterDocument = {
			...createDocumentDTO, numberDocument
		}

		// const newRegisterDocument = await this.documentsService.create(createDocumentDTO)

		// return nuevoDocumento;
		res.send(newRegisterDocument)
		console.log('esto es newRegisterDocument.file de controller')
		console.log(newRegisterDocument.file)
		return this.documentsService.create(newRegisterDocument);
	} catch (error){
		throw new BadRequestException('Something bad happened in the send data', { cause: new Error(), description: 'some data was sent in a wrong way' });
		// throw new NotFoundException('Something bad happened in the send data', { cause: new Error(), description: 'some data was sent in a wrong way' })
	}
	}

	// @Post('form')
	// @UseInterceptors(FileInterceptor('file'))
	// async uploadDocument(
	//   @UploadedFile() file: Express.Multer.File,
	// ): Promise<any> {
	//   // Procesar el archivo y los datos JSON aquí
	//   const jsonData = JSON.parse(file.buffer.toString());
	//   // Guardar los datos en MongoDB usando el servicio correspondiente
	//   const savedDocument = await this.documentsService.createDocument(jsonData);
	//   // Retornar la respuesta adecuada
	//   return {
	// 	message: 'Documento guardado exitosamente',
	// 	document: savedDocument,
	//   };
	// }

	
	@Get()
	@ApiOperation({
		summary: 'see all documents or search by filters',
	})
	@ApiNotFoundResponse({ description: 'The documents cant find'})
	@ApiQuery({name: 'numberDocument', example: 'DOC-001', required: false, description: 'search document by numer document'})
	@ApiQuery({name: 'title', example: 'Gastos', required: false, description: 'search document by title'})
	@ApiQuery({name: 'authorDocument', example: 'Juan Pablo', required: false, description: 'search document by author'})
	@ApiOkResponse({description: 'documents finds', type: CreateDocumentDTO})
	@ApiNotFoundResponse({description: 'documents not founds'})
	findAll(@Req() request: Request){
		return this.documentsService.findAll(request);
	}

	@Get('active')
	@ApiOperation({summary: 'see only documents actives',})
	@ApiQuery({name: 'numberDocument', example: 'DOC-001', required: false, description: 'search document by numer document'})
	@ApiQuery({name: 'title', example: 'Gastos', required: false, description: 'search document by title'})
	@ApiQuery({name: 'authorDocument', example: 'Juan Pablo', required: false, description: 'search document by author'})
	async findDocumentActive(
		@Query('numberDocument') numberDocument: string,
		@Query('title') title: string,
		@Query('authorDocument') authorDocument: string,
		@Req() request: Request
		): Promise<Documents[]>{
			const query: any = { active: true };
			if(numberDocument) {
				query.numberDocument = numberDocument
			}
			if(title) {
				query.title = title
			}
			if(authorDocument) {
				query.authorDocument = authorDocument
			}
		return this.documentsService.findDocumentsActive(query)
	} 

	@Get('inactive')
	@ApiOperation({summary: 'see only documents inactives',})
	@ApiQuery({ name: 'numberDocument', example: 'DOC-001', required: false, description: 'search document by numer document' })
	@ApiQuery({ name: 'title', example: 'Gastos', required: false, description: 'search document by title' })
	@ApiQuery({ name: 'authorDocument', example: 'Juan Pablo', required: false, description: 'search document by author' })
	async findDocumentInactive(
		@Query('numberDocument') numberDocument: string,
		@Query('title') title: string,
		@Query('authorDocument') authorDocument: string,
		@Req() request: Request
	): Promise<Documents[]>{
		const query: any = { active: false };
		if(numberDocument) {
			query.numberDocument = numberDocument
		}
		if(title) {
			query.title = title
		}
		if(authorDocument) {
			query.authorDocument = authorDocument
		}
		return this.documentsService.findDocumentsInactive(query)
	} 

  	@ApiOperation({ summary: 'get records by pagination', description: 'Gets the records of documents by pagination'})
  	@ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  	@ApiQuery({ name: 'offset', type: Number, example: 0, required: false })
  	@Get('paginacion')
  	findAllPaginate(@Query() paginationDto: PaginationDto ) {
    return this.documentsService.findAllPaginate( paginationDto );
  	}

	@Get(':id')
	@ApiOperation({
		summary: 'search document by id',
	})
	@ApiOkResponse({description: 'document find'})
	@ApiNotFoundResponse({description: 'document not found or not exist'})
	@ApiForbiddenResponse({description: 'document forbiden, document not use now'})
	async findOne(@Param('id', ParseObjectIdPipe) id: string, active: boolean){
		const document = await this.documentsService.findOne(id)
		if(!document.active){
			throw new ForbiddenException('documento inactivo')
		}
		return this.documentsService.findOne(id);
	}

	// @Get(':id/versions')
	// async getVersion(@Param('id', ParseObjectIdPipe) id: string, @Param('version', ParseIntPipe) version: number ): Promise<Documents>{
	// 	const document = await this.documentsService.getDocumentVersion(id, version)
	// 	if(!document.active){
	// 		throw new ForbiddenException('documento inactivo')
	// 	}
	// 	return this.documentsService.getDocumentVersion(id, version)
	// }

	// @Get('file-register')
	// @ApiOperation({summary: 'Get file register data from documents'})
	// async getFileRegisterData(): Promise<any[]>{
	// 	console.log('qeuruereru')
	// 	return this.documentsService.getFileRegisterData()
	// }

	@Get(':id/versions/:version')
	async getDocumentVersion(
	  @Param('id') id: string,
	  @Param('version', ParseIntPipe) version: number,
	): Promise<Documents> {
	  return this.documentsService.getDocumentVersion(id, version);
	}

	@Put(':id')
	@ApiOperation({summary: 'update document by id',})
	@ApiOkResponse({description: 'document update correctly'})
	@ApiNotFoundResponse({description: 'document not found'})
	@ApiForbiddenResponse({description: 'document not use now'})
	async update(@Param("id") id: string, @Body() updateDocumentDTO: UpdateDocumentDTO): Promise<Documents>{
		const document = await this.documentsService.findOne(id)
		if(!document.active){
			throw new ForbiddenException('documento inactivo')
		}
		// if(updateDocumentDTO.file === ""){
		// 	const existingDocument = this.documentsService.findOne(id);
		// 	// (await existingDocument).fileRegister
		// 	if((await existingDocument).fileRegister === undefined){
		// 			updateDocumentDTO.file = (await existingDocument).fileRegister.toString();
		// 	}
		// }
		return this.documentsService.update(id, updateDocumentDTO)
	}

	// @Put(':id/base64')
	// async updateDocumentWithBAse64(@Param('id') id: string, @Body() Base64DocumentResponseDTO: Base64DocumentResponseDTO): Promise<any>{
	// 	const updateDocument = await this.documentsService.updateDocumentWithBase64Data(
	// 		id,
	// 		Base64DocumentResponseDTO,
	// 	);

	// 	return {success: true, data: updateDocument}
	// }

	// @Put(':documentId/personal/:personalId')
	// @ApiOperation({ summary: 'Copy personal data to document' })
	// @ApiTags('Document Registry')
	// public async copyPersonalDataToDocument(
	// 	@Param('documentId') documentId: string,
	// 	@Param('personalId') personalId: string,
	// ): Promise<Documents>{
	// 	try{
	// 		const personalData = await this.personalService.fetchDataFromExternalServerById(personalId);
	// 		const updateDocument = await 
	// 	}
	// }


	@Delete(':id/inactive')
	@ApiOkResponse({description: 'document converted to inactive successfully'})
	@ApiNotFoundResponse({description: 'document not found or not exist'})
	@ApiOperation({summary: 'assign a document record to inactive using id',})
	async deleteDocument(@Param('id') id: string, active: boolean,) {
		return this.documentsService.inactiverDocument(id, active)
	}

	@Put(':id/active')
	@ApiOperation({summary: 'reactivate a document record'})
	async reactiverDocument(@Param('id') id: string, active: boolean){
		return this.documentsService.activerDocument(id, active)
	}

	// @Delete(':id')
	// @ApiOperation({
	// 	summary: 'delete documento by id',
	// })
	// remove(@Param('id') id: string){
	// 	return this.documentsService.remove(id);
	// }

	// @Post(':id/physical-location')
	// @ApiOperation({
	// 	summary: 'create dates from physical lcation',
	//   })
	// @ApiOkResponse({description: 'add physical-location correctly'})
	// async addPhysicalLocation(
	// 	@Param('id', ParseObjectIdPipe) id: string,
	// 	@Body() physicalLocation: CreatePhysicalLocationDto,
	// ){
	// 	return this.documentsService.addPhysicalLocation(id, physicalLocation)
	// }

	@Post(':id/comment')
	@ApiOperation({
		summary: 'add dates from commnet document',
	})
	@ApiOkResponse({description: 'add comment into de document corectly'})
	async addComment(
		@Param('id', ParseObjectIdPipe) id: string,
		@Body() comment: CreateCommentDto, 
	){
		return this.documentsService.addComment(id, comment)
	}

	@Post(':id/signature-aproved')
	@ApiOperation({
		summary: 'add signatures aproved for document',
	})
	@ApiOkResponse({description: 'approved signatures affixed to the document correctly'})
	async addSignatureAproved(
		@Param('id', ParseObjectIdPipe) id: string,
		@Body() signatureAproved: CreateSignatureAprovedDto,
	){
		return this.documentsService.addSignatureAproved(id, signatureAproved)
	}

	@Post(':id/milestone')
	@ApiOperation({
		summary: 'add milestone for documento',
	})
	@ApiOkResponse({description: 'milestones add into de document correctly'})
	async addMIlestone(
		@Param('id', ParseObjectIdPipe) id: string,
		@Body() milestone: CreateMilestoneDto,
	) {
		return this.documentsService.addMilestones(id, milestone)
	}	
}
