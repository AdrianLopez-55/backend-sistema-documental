import { Injectable, Req, NotFoundException } from '@nestjs/common';
import { UpdateDocumentDTO } from './dto/updateDocument.dto';
import { CreateDocumentDTO } from './dto/createDocument.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { Request, response } from 'express';
import { PaginationDto } from 'src/common/pagination.dto';
import { HttpService } from '@nestjs/axios';
import { Observable, map } from 'rxjs';
import { Base64DocumentDto } from 'src/base64-document/dto/base64-document.dto';
import { Base64DocumentResponseDTO } from 'src/base64-document/dto/base64-document-response.dto';

@Injectable()
export class DocumentsService {

	private defaultLimit: number

	constructor(@InjectModel(Documents.name) private readonly documentModel: Model<DocumentDocument>, private readonly httpService: HttpService){}
	
	async create(createDocumentDTO: CreateDocumentDTO): Promise<Documents> {
		// const personalDataUrl = process.env.API_PERSONAL;
		// try {
		// 	const response = await this.httpService.get(`${personalDataUrl}/api/personal`).toPromise();
		// 	console.log(response.data)
		// 	const personalData = response.data;
		// 	const selectedAutor = personalData.name;
		// 	console.log(selectedAutor)
		// 	const documentToRegister = {
		// 		...createDocumentDTO,
		// 		authorDocument: selectedAutor,
		// 	};

		// const createdDocument = new this.documentModel(documentToRegister);
		// console.log(createdDocument)
		// const savedDocument = await createdDocument.save();
		// return savedDocument
		// } catch (error){
		// 	console.log(error);
		// 	throw new Error('error al registrar documento')
		// }

		//para enviar id de archivo del servicio externo
		// const externalApiUrl = 'http://10.10.214.219:3200/';
		// const response = await this.httpService.get(`${externalApiUrl}/file/${createDocumentDTO.fileId}`).toPromise();
		// const fileData = response.data;

		// createDocumentDTO.filename = fileData.filename
		// createDocumentDTO.originalname = fileData.originalname
		// createDocumentDTO.filePath = fileData.filePath
		// createDocumentDTO.category = fileData.category

		const externalApiPersonal = ''
		

		const newDocument = new this.documentModel(createDocumentDTO)

		return newDocument.save();
	}

	//obtener personal
	// getPersonalId(_id: string): Observable<any>{
	// 	const url = `${process.env.API_PERSONAL}/api/personal/${_id}`
	// 	return this.httpService.get(url).pipe(
	// 		map(response => response.data),
	// 	)
	// }
	


	async findAll(request: Request): Promise<Documents[]> {
		//const sortOptions = sort ? { [sort]: 1 } : {};
		return this.documentModel.find(request.query).sort({numberDocument: 1}).setOptions({sanitizeFilter: true}).exec();
	}

	async findDocumentsActive(): Promise<Documents[]>{
		return this.documentModel.find(({active: true})).sort({numberDocument: 1}).exec();
	}

	async findDocumentsInactive(): Promise<Documents[]>{
		return this.documentModel.find(({active: false})).exec();
	}

	findAllPaginate( paginationDto: PaginationDto ) {
		const { limit = this.defaultLimit, offset = 0 } = paginationDto;
		return this.documentModel.find({active: true})
		  .limit( limit )
		  .skip( offset )
	}

	async findOne(id: string): Promise<Documents>{
		return this.documentModel.findOne({_id: id}).exec();
	}

	// async getVersion(id: string): Promise<Documents>{
	// 	const versions = await this.documentModel.findById({_id:id}).select('-__v')
	// 	return versions;
	// }

	// async getDocumentVersion(id: string, version: number): Promise<Documents>{
	// 	const document = await this.documentModel.findById(id).select(`-__v`).lean().exec();
	// 	if(!document){
	// 		throw new NotFoundException('Documento no encontrado');
	// 	}
	// 	if (document.__v < version) {
	// 		throw new NotFoundException('Versión del documento no encontrada');
	// 	}
	// 	const specificVersion = await this.documentModel.findById(id).select(`-__v`).lean().exec();

	// 	return specificVersion;
	// }

	async getDocumentVersion(id: string, version: number): Promise<Documents> {
		const document = await this.documentModel
		  .findOne({ _id: id, __v: version })
		  .select('-__v')
		  .lean()
		  .exec();
	  
		if (!document) {
		  throw new NotFoundException('Versión del documento no encontrada');
		}
	  
		return document;
	  }

	async update(id: string, updateDocumentDTO: UpdateDocumentDTO) {
		const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO}, {new: true}).exec();
		return (await document).save();
	}

	async remove(id: string) {
		return this.documentModel.findByIdAndRemove({ _id: id}).exec();
	}
	
	// async addPhysicalLocation(id: string, physicalLocation: any) {
	// 	let document: DocumentDocument = await this.documentModel.findById(id);
	// 	document.physicalLocation.push(physicalLocation);
	// 	document.save();
	// 	return document;
	// }

	async addComment(id: string, comment: any) {
		let document: DocumentDocument = await this.documentModel.findById(id);
		document.comments.push(comment);
		document.save();
		return document;
	}

	async addSignatureAproved(id: string, signaturedAproved: any){
		let document: DocumentDocument = await this.documentModel.findById(id);
		document.signatureAproved.push(signaturedAproved);
		document.save();
		return document
	}

	async addMilestones(id: string, milestone: any){
		let document: DocumentDocument = await this.documentModel.findById(id);
		document.milestone.push(milestone);
		document.save();
		return document
	}

	async inactiverDocument(id: string, active: boolean) {
		const document: DocumentDocument = await this.documentModel.findById(id);
		document.active = false;
		await document.save();
		return document;
	}

	async activerDocument(id: string, active: boolean){
		const document: DocumentDocument = await this.documentModel.findById(id);
		document.active = true;
		await document.save();
		return document
	}

	// async updateDocumentWithBase64Data(id: string, base64DocumentResponseDTO: Base64DocumentResponseDTO): Promise<Documents | null>{
	// 	const updateDocument = await this.documentModel.findOneAndUpdate(
	// 		{_id: id},
	// 		{
	// 			_id: base64DocumentResponseDTO._id,
	// 			filename: base64DocumentResponseDTO.filename,
	// 			extension: base64DocumentResponseDTO.extension,
	// 			size: base64DocumentResponseDTO.size,
	// 			filePath: base64DocumentResponseDTO.filePath,
	// 			status: base64DocumentResponseDTO.status,
	// 			category: base64DocumentResponseDTO.category,
	// 			mime: base64DocumentResponseDTO.mime,
	// 			base64: base64DocumentResponseDTO.base64
	// 		},
	// 		{new: true}
	// 	).exec();
	// 	console.log(updateDocument)

	// 	return updateDocument;
	// }

	// public async updateDocumentWithPersonalData(
	// 	documentId: string,
	// 	personalData: any,
	// ): Promise<Documents>{
	// 	try {
	// 		const document = await this.documentModel.findById(documentId);

	// 		if(!document){
	// 			throw new NotFoundException('Documento no encontrado');
	// 		}

	// 		document.file
	// 	}
	// }
}