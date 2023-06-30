import { HttpException, Injectable, Req, NotFoundException, GatewayTimeoutException } from '@nestjs/common';
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
import { UpdateFileRegisterDTO } from './dto/updateFileRegister.dto';

@Injectable()
export class DocumentsService {

	private defaultLimit: number;
	private readonly apiFilesUploader = process.env.API_FILES_UPLOADER;

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

		// const externalApiPersonal = ''
		
		const { file } = createDocumentDTO
		if(file){
			const mimeType = file.split(';')[0].split(':')[1];
			const base64 = file.split(',')[1];

			const fileObj = {
				mime: mimeType,
				base64: base64
			}


		try {
			const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise()
			const { _id, filename, size, filePath, status, category, extension } = response.data.file;
			let fileRegister = {}
			fileRegister = {
				_id,
				filename,
				size,
				filePath,
				status,
				category,
				extension
			}
			console.log('esto es fileRegister')
			console.log(fileRegister)

			// const createDocumentDTO: CreateDocumentDTO = {
			// 	file: 'Se registro el archivo'
			// }
			// const updateDocument = await documentModel
			// console.log('esto es el dto de base64documentResponse')
			// console.log(createDocumentDTO)


			
			const newDocument = new this.documentModel({...createDocumentDTO, fileRegister})
			// console.log('esto es newDocument')
			// console.log(newDocument)
			return newDocument.save();

		} catch (error) {
			// throw error.response?.data
			throw new GatewayTimeoutException('Something bad hapened', {cause: new Error(), description: 'cannot get a response in time with the external service'});
			
		}
	  } else if(file === null){
			let fileRegister = {};
			const newDocument = new this.documentModel({...createDocumentDTO, fileRegister})
			// console.log('esto es newDocument sin file base64')
			// console.log(newDocument)
			return newDocument.save();
	  } else {
		if(file === undefined){
			let fileRegister = {};
			const newDocument = new this.documentModel({...createDocumentDTO, fileRegister})
		}
	  }

		// const newDocument = new this.documentModel(...createDocumentDTO)
		// console.log('esto es newDocument')
		// console.log(newDocument)
		//return newDocument //await this.documentModel.create()//newDocument.save();
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

	// async findDocumentsActive(query: any): Promise<Documents[]>{
	// 	return this.documentModel.find({active: true}).sort({numberDocument: 1}).setOptions({sanitizeFilter: true}).exec();
	// }

	async findDocumentsActive(query: any): Promise<Documents[]>{
		return this.documentModel.find(query).sort({numberDocument: 1}).setOptions({sanitizeFilter: true}).exec();
	}

	async findDocumentsInactive(query: any): Promise<Documents[]>{
		return this.documentModel.find(query).sort({numberDocument: 1}).setOptions({sanitizeFilter: true}).exec();
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

	// async getFileRegisterData(): Promise<any[]>{
	// 	const document = await this.documentModel.find({}, 'fileRegister').exec();
	// 	console.log(document)
	// 	return document.map((doc) => doc.fileRegister)
	// }

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

	async update(id: string, updateDocumentDTO: UpdateDocumentDTO): Promise<Documents> {
		const findDocument = await this.documentModel.findById(id)
		if(!findDocument.active){
			throw new HttpException('document Inactive', 404)
		}
		const { file } = updateDocumentDTO;
		if(file && file.startsWith('data')){
			const mimeType = file.split(';')[0].split(':')[1];
			const base64 = file.split(',')[1];

			const fileObj = {
				mime: mimeType,
				base64: base64
			};
			if(findDocument.fileRegister){
				try {
					const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise()
					const { _id, filename, size, filePath, status, category, extension } = response.data.file;
					let fileRegister = {}
					fileRegister = {
						_id,
						filename,
						size,
						filePath,
						status,
						category,
						extension
					}
					// console.log('esto es fileRegister')
					// console.log(fileRegister)
		
					// const createDocumentDTO: CreateDocumentDTO = {
					// 	file: 'Se registro el archivo'
					// }
					// const updateDocument = await documentModel
					// console.log('esto es el dto de base64documentResponse')
					// console.log(createDocumentDTO)
		
		
					
					//const newDocument = new this.documentModel({...updateDocumentDTO, fileRegister})
					// // console.log('esto es newDocument')
					// // console.log(newDocument)
					// return newDocument.save();
					
					const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, fileRegister}, {new: true}).exec();
					
					return document;
		
				// } catch (error) {
				// 	// throw error.response?.data
				// 	throw new GatewayTimeoutException('Something bad hapened', {cause: new Error(), description: 'cannot get a response in time with the external service'});
					
				// }
			} catch (error){
				throw error.response?.data
			}
			} else {
				try {
					const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise();
					const { _id, filename, size, filePath, status, category, extension } = response.data.file;
					let fileRegister = {}
					fileRegister = {
						_id,
						filename,
						size,
						filePath,
						status,
						category,
						extension
					}
					// const newDocument = new this.documentModel({...updateDocumentDTO, fileRegister})
					const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, fileRegister}, {new: true}).exec();
					console.log(document)
					return document;
				} catch (error){
					throw error.response?.data;
				}
			}
		} else {
			if(findDocument.fileRegister === null){
				console.log('es null')
				updateDocumentDTO.file = null;
				const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO}, {new: true}).exec();
				console.log(document)
				return document
			}
			console.log('sin nadaaaa y con datos en fileRegister')
			updateDocumentDTO.file = findDocument.fileRegister.toString()
			const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO}, {new: true}).exec();
			console.log(document)
			return document
			
		}
	}
		// try {
		// 	const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise()
		// 	const { _id, filename, size, filePath, status, category, extension } = response.data.file;
		// 	let fileRegister = {}
		// 	fileRegister = {
		// 		_id,
		// 		filename,
		// 		size,
		// 		filePath,
		// 		status,
		// 		category,
		// 		extension
		// 	}
		// 	// console.log('esto es fileRegister')
		// 	// console.log(fileRegister)

		// 	// const createDocumentDTO: CreateDocumentDTO = {
		// 	// 	file: 'Se registro el archivo'
		// 	// }
		// 	// const updateDocument = await documentModel
		// 	// console.log('esto es el dto de base64documentResponse')
		// 	// console.log(createDocumentDTO)


			
		// 	const newDocument = new this.documentModel({...updateDocumentDTO, fileRegister})
		// 	// // console.log('esto es newDocument')
		// 	// // console.log(newDocument)
		// 	// return newDocument.save();
			
		// 	const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, newDocument}, {new: true}).exec();
		// 	console.log(document)
		// 	return await document;

		// } catch (error) {
		// 	// throw error.response?.data
		// 	throw new GatewayTimeoutException('Something bad hapened', {cause: new Error(), description: 'cannot get a response in time with the external service'});
			
		// }
	   //else {
		// if(file === ""){
		// 	const existingDocument = this.documentModel.findOne({_id: id}).exec()
		// 	if((await existingDocument).fileRegister === undefined){
		// 		if((await existingDocument).fileRegister !== null){
		// 			updateDocumentDTO.file = (await existingDocument).fileRegister.toString();
		// 			const newDocument = new this.documentModel({...updateDocumentDTO})
		// 			const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, newDocument /*...updateDocumentDTO*/}, {new: true}).exec();
		// 			console.log(document)
		// 			return (await document).save();
		// 		}
		// 	}
		// }
	  //}

		
		
		// const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO}, {new: true}).exec();
		// return (await document).save();
	

	// async updateRegisterDocumentById(id: string, updateFileRegisterDTO: UpdateFileRegisterDTO){
	// 	// const documentId = this.documentModel.findOne({_id: id}).exec();
	// 	let document: DocumentDocument = await this.documentModel.findById(id);
	// 	let fileRegisterDocument = document.fileRegister;
	// }

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

	async filesUploader(createDocumentDTO:CreateDocumentDTO, res: Response) {
		// try {
		// 	const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, base64DocumentDto).toPromise();
		// 	const fileData: Base64DocumentResponseDTO = response.data
		// 	return fileData
		// } catch (error) {
		// 	throw error.response?.data
		// }

		const { file } = createDocumentDTO
		if(file){
			const mimeType = file.split(';')[0].split(':')[1];
			const base64 = file.split(',')[1];

			const fileObj = {
				mime: mimeType,
				base64: base64
			}

		try {
			const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise()
			const { _id, filename, size, filePath, status, category, extension } = response.data.file;

			const base64DocumentResponseDTO: Base64DocumentResponseDTO = {
				_id: _id,
				filename: filename,
				extension: extension,
				size: size,
				filePath: filePath,
				status: status,
				category: category,
			}
			// const updateDocument = await documentModel
			console.log('esto es el dto de base64document')
			console.log(base64DocumentResponseDTO)
			return base64DocumentResponseDTO

		} catch (error) {
			
			// throw error.response?.data
			throw new GatewayTimeoutException('Something bad hapened', {cause: new Error(), description: 'cannot get a response in time with the external service'});
			
		}
	  }

	// async create(base64FileUploadDTO: Base64FileUploadDTO){
	// 	return await this.base64FileModel.create(base64FileUploadDTO)
	// }
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