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
	BadRequestException, 
	ParseIntPipe, 
	Res, 
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDTO } from './dto/updateDocument.dto'
import { 
	ApiBadRequestResponse, 
	ApiBearerAuth, 
	ApiCreatedResponse, 
	ApiForbiddenResponse, 
	ApiNotFoundResponse, 
	ApiOkResponse, 
	ApiOperation, 
	ApiQuery, 
	ApiTags 
} from '@nestjs/swagger';
import { CreateDocumentDTO } from './dto/createDocument.dto';
import { Request, Response } from 'express';
import { ParseObjectIdPipe } from 'src/utilities/parse-object-id-pipe.pipe';
import { CreateCommentDto } from './dto/createComment.dto';
import { CreateSignatureAprovedDto } from './dto/createSignatureAproved.dto';
import { CreateMilestoneDto } from './dto/createMilestone.dto';
import { SequenceService } from './sequenceService.service';
import { PaginationDto } from 'src/common/pagination.dto';
import { Documents } from './schema/documents.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './multer.config';
import { Roles } from 'src/guard/decorators/roles.decorator';
import { UserRole } from 'src/guard/constants/roles';
import { RolesGuard } from 'src/guard/roles.guard';

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
	@UseInterceptors(FileInterceptor('file', multerConfig))
	@ApiCreatedResponse({ description: 'The document has been successfully created.', type: CreateDocumentDTO})
	@ApiBadRequestResponse({description: 'bad request response'})
	async create(@Res() res: Response, @Body() createDocumentDTO: CreateDocumentDTO){
		
		try{
		const numberDocument = await this.sequenceService.getNextValueNumberDocument();
		
		if(createDocumentDTO.file === ""){
			createDocumentDTO.file = null
		}

		const newRegisterDocument = {
			...createDocumentDTO, numberDocument
		}
		// if(createDocumentDTO.ciPersonal === ""){
		// 	throw new BadRequestException('ci cant not empty', { cause: new Error(), description: 'ci not empty '})
		// }

		res.send(newRegisterDocument)
		return this.documentsService.create(newRegisterDocument);
	} catch (error){
		throw new BadRequestException('Something bad happened in the send data', { cause: new Error(), description: 'some data was sent in a wrong way' });
	}
	}
	
	@Get()
	// @ApiBearerAuth()
	// @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.USER)
	// @UseGuards(RolesGuard)
	@ApiOperation({
		summary: 'see all documents or search by filters',
	})
	@ApiNotFoundResponse({ description: 'The documents cant find'})
	@ApiQuery({name: 'numberDocument', example: 'DOC-001', required: false, description: 'search document by numer document'})
	@ApiQuery({name: 'title', example: 'Gastos', required: false, description: 'search document by title'})
	// @ApiQuery({name: 'name', example: 'jeol', required: false, description: 'search document by author'})
	@ApiOkResponse({description: 'documents finds', type: CreateDocumentDTO})
	@ApiNotFoundResponse({description: 'documents not founds'})
	findAll(@Req() request: Request){
		// const query: any = { active: true };
		// if(name){
		// 	query.name = name
		// }
		return this.documentsService.findAll(request);
	}

	@Get('active')
	@ApiOperation({summary: 'see only documents actives',})
	@ApiQuery({name: 'numberDocument', example: 'DOC-001', required: false, description: 'search document by numer document'})
	@ApiQuery({name: 'title', example: 'Gastos', required: false, description: 'search document by title'})
	// @ApiQuery({name: 'authorDocument', example: 'Juan Pablo', required: false, description: 'search document by author'})
	async findDocumentActive(
		@Query('numberDocument') numberDocument: string,
		@Query('title') title: string,
		// @Query('authorDocument') authorDocument: string,
		@Req() request: Request
		): Promise<Documents[]>{
			const query: any = { active: true };
			if(numberDocument) {
				query.numberDocument = numberDocument
			}
			if(title) {
				query.title = title
			}
			// if(authorDocument) {
			// 	query.authorDocument = authorDocument
			// }
		return this.documentsService.findDocumentsActive(query)
	} 

	@Get('inactive')
	@ApiOperation({summary: 'see only documents inactives',})
	@ApiQuery({ name: 'numberDocument', example: 'DOC-001', required: false, description: 'search document by numer document' })
	@ApiQuery({ name: 'title', example: 'Gastos', required: false, description: 'search document by title' })
	// @ApiQuery({ name: 'authorDocument', example: 'Juan Pablo', required: false, description: 'search document by author' })
	async findDocumentInactive(
		@Query('numberDocument') numberDocument: string,
		@Query('title') title: string,
		// @Query('authorDocument') authorDocument: string,
		@Req() request: Request
	): Promise<Documents[]>{
		const query: any = { active: false };
		if(numberDocument) {
			query.numberDocument = numberDocument
		}
		if(title) {
			query.title = title
		}
		// if(authorDocument) {
		// 	query.authorDocument = authorDocument
		// }
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
		if(updateDocumentDTO.ciPersonal === ""){
			throw new BadRequestException('ci no colocado')
		}
		
		return this.documentsService.update(id, updateDocumentDTO)
	}

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
