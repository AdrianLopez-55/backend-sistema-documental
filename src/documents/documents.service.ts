import { 
	HttpException, 
	Injectable, 
	NotFoundException, 
	GatewayTimeoutException 
} from '@nestjs/common';
import { UpdateDocumentDTO } from './dto/updateDocument.dto';
import { CreateDocumentDTO } from './dto/createDocument.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { Request } from 'express';
import { PaginationDto } from 'src/common/pagination.dto';
import { HttpService } from '@nestjs/axios';
import { Base64DocumentResponseDTO } from 'src/base64-document/dto/base64-document-response.dto';
import { ObtainDataPersonalDTO } from './dto/personal-result.dto';

@Injectable()
export class DocumentsService {

	private defaultLimit: number;
	private readonly apiFilesUploader = process.env.API_FILES_UPLOADER;

	constructor(@InjectModel(Documents.name) private readonly documentModel: Model<DocumentDocument>, private readonly httpService: HttpService){}
	
	async create(createDocumentDTO: CreateDocumentDTO): Promise<Documents | any> {
		const personalDataUrl = `${process.env.API_PERSONAL_GET}?ci=${encodeURIComponent(createDocumentDTO.ciPersonal)}`;

		const { file } = createDocumentDTO
		if(file){
			const mimeType = file.split(';')[0].split(':')[1];
			const base64 = file.split(',')[1];

			const fileObj = {
				mime: mimeType,
				base64: base64
			}
			
		try {
			
			//------------- obtain personal to register -----------
			const responsePersonal = await this.httpService.get(personalDataUrl).toPromise();
			const personalDataList = responsePersonal.data
			
			if(personalDataList.length === 0){
				throw new Error('Personal not exists')
			}

			const personalData = personalDataList.find((data: ObtainDataPersonalDTO) => data.ci === createDocumentDTO.ciPersonal);
			if (!personalData) {
				throw new Error('cant not find persoanl with that ci');
			}
	
			const { _idP, name, ci, email, phone, nationality } = personalData;
			let authorDocument = {}; 
			authorDocument = { _idAutor: _idP, name, ci, email, phone, nationality };


			//------------file update register ------------
			const lengthBase64 = fileObj.base64.length;
			if(lengthBase64 < 4){
				console.log('base64 no valido')
				throw new Error('base64 not valid!')
			} else if(fileObj.mime === undefined){
				throw new Error('base64 not valid, not contain a correct mime')
			} else if(fileObj.base64 === undefined){
				throw new Error('base64 not valid, bad base64 send')
			}

			const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise()
			const { _id, filename, size, filePath, status, category, extension } = response.data.file;
			let fileRegister = {}
			fileRegister = {
				_idFile: _id,
				filename,
				size,
				filePath,
				status,
				category,
				extension
			}
			
			const newDocument = new this.documentModel({...createDocumentDTO, fileRegister, authorDocument})
			console.log('esto es newDocument')
			console.log(newDocument)

			return newDocument.save();

		} catch (error) {
			throw new GatewayTimeoutException('Something bad hapened', {cause: new Error(), description: 'cannot get a response in time with the external service'});
		}

	  } else if(file === null){
			const responsePersonal = await this.httpService.get(personalDataUrl).toPromise();
			const personalDataList = responsePersonal.data
			// console.log('esto es personalDAtaList')
			// console.log(personalDataList)
			if(personalDataList.length === 0){
				throw new Error('No se encontró el personal 1111111')
		}

			const personalData = personalDataList.find((data: ObtainDataPersonalDTO) => data.ci === createDocumentDTO.ciPersonal);
			if (!personalData) {
				throw new Error('No se encontró el personal 2222222');
			}
			console.log('esto es personalData')
			console.log(personalData)

			const { _idPersonal, name, ci, email, phone, nationality } = personalData
			let authorDocument = {}; 
			authorDocument = { _idPersonal, name, ci, email, phone, nationality };

			let fileRegister = {};
			const newDocument = new this.documentModel({...createDocumentDTO, fileRegister, authorDocument})
			console.log('esto es newDocument')
			console.log(newDocument)
			return newDocument.save();
	  } else {
		if(file === undefined){
			const responsePersonal = await this.httpService.get(personalDataUrl).toPromise();
			const personalDataList = responsePersonal.data
			// console.log('esto es personalDAtaList')
			// console.log(personalDataList)
			
			if(personalDataList.length === 0){
				throw new Error('No se encontró el personal 1111111')
			}

			const personalData = personalDataList.find((data: ObtainDataPersonalDTO) => data.ci === createDocumentDTO.ciPersonal);

			if (!personalData) {
				throw new Error('No se encontró el personal 2222222');
			}

			// console.log('esto es personalData')
			// console.log(personalData)
			const { _idPersonal, name, ci, email, phone, nationality } = personalData
			let authorDocument = {}; 
			authorDocument = { _idPersonal, name, ci, email, phone, nationality };


			let fileRegister = {};
			const newDocument = new this.documentModel({...createDocumentDTO, fileRegister, authorDocument})
			return newDocument.save();
		}
	  }
	}

	async findAll(request: Request): Promise<Documents[]> {
		return this.documentModel.find(request.query).sort({numberDocument: 1}).setOptions({sanitizeFilter: true}).exec();
	}

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
		const personalDataUrl = `${process.env.API_PERSONAL_GET}?ci=${encodeURIComponent(updateDocumentDTO.ciPersonal)}`;
		
		if(!findDocument.active){
			throw new HttpException('document Inactive', 403)
		}
		if(!findDocument){
			throw new HttpException('document not exist', 404)
		}

		const { file } = updateDocumentDTO;
		const { ciPersonal } = updateDocumentDTO
		//--------- todos los casos en los que base64 se envio de manera correcta
		if(file && file.startsWith('data')){
			const mimeType = file.split(';')[0].split(':')[1];
			const base64 = file.split(',')[1];

			const fileObj = {
				mime: mimeType,
				base64: base64
			};
			if(findDocument.fileRegister){
				if(findDocument.authorDocument){
					try {

						//--------------------------update personal---------------------------------
						const responsePersonal = await this.httpService.get(personalDataUrl).toPromise();
						const personalDataList = responsePersonal.data
						
						if(personalDataList.length === 0){
							throw new Error('Personal not exists')
						}
			
						const personalData = personalDataList.find((data: ObtainDataPersonalDTO) => data.ci === updateDocumentDTO.ciPersonal);
						if (!personalData) {
							throw new Error('cant not find persoanl with that ci');
						}
				
						const { _idPersonal, name, ci, email, phone, nationality } = personalData;
						let authorDocument = {}; 
						authorDocument = { _idPersonal, name, ci, email, phone, nationality };
						
						//------------------------update files ----------------------------------
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
							//------- update con ci vacio ---------
							if(ciPersonal === ""){
								updateDocumentDTO.ciPersonal = findDocument.authorDocument.toString();
								const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO}, {new: true}).exec();
								return document
							}
							
							
							//---------------------
							const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, fileRegister, authorDocument}, {new: true}).exec();
							console.log('nuevos datos puestos')
							console.log(document)
							return document;
		
					} catch (error){
						throw error.response?.data
					}
				} else {
					try {
						if(findDocument.authorDocument === null){
							updateDocumentDTO.ciPersonal = null
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
							const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, fileRegister}, {new: true}).exec();
							return document;
						}
						updateDocumentDTO.ciPersonal = findDocument.authorDocument.toString()
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
							const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, fileRegister}, {new: true}).exec();
							return document;
						
					}catch (error){
						throw new Error('Datos no validos')
					}
				}//  else if(updateDocumentDTO.ciPersonal === "" || updateDocumentDTO.ciPersonal === ''){
					
				// 		updateDocumentDTO.ciPersonal = findDocument.authorDocument.toString();
				// 		const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO}, {new: true}).exec();
				// 		console.log('update con ci vacio para mantener datos, document')
				// 		console.log(document)
				// 		return document
					
				// }
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
					
					const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, fileRegister}, {new: true}).exec();
					console.log('document para segundo caso de fileregister')
					console.log(document)
					return document;
				} catch (error){
					throw error.response?.data;
				}
			}
		} else {
			//----------- if para caso de que fileregister se envie vacio y haya null en dato fileregister ----------
			if(findDocument.fileRegister === null){
				console.log('es null fileregister')
				updateDocumentDTO.file = null;

				// ------------ edicion ciPersonal si base64 se envia vacio ----------------
				const responsePersonal = await this.httpService.get(personalDataUrl).toPromise();
				const personalDataList = responsePersonal.data
				
				
				if(personalDataList.length === 0){
					throw new Error('Personal not exists')
				}
	
				const personalData = personalDataList.find((data: ObtainDataPersonalDTO) => data.ci === updateDocumentDTO.ciPersonal);
				if (!personalData) {
					throw new Error('cant not find persoanl with that ci');
				}
		
				const { _idPersonal, name, ci, email, phone, nationality } = personalData;
				let authorDocument = {}; 
				authorDocument = { _idPersonal, name, ci, email, phone, nationality };

				const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, authorDocument}, {new: true}).exec();
				console.log(document)
				return document
			}

			console.log('se envio vacio file y con datos en fileRegister para mantener')
			
			updateDocumentDTO.file = findDocument.fileRegister.toString()
			//---------------- update ciPersonal si se envia vacio en file y hay datos ya registrados de fileregister
			const responsePersonal = await this.httpService.get(personalDataUrl).toPromise();
			const personalDataList = responsePersonal.data
			
			if(personalDataList.length === 0){
				throw new Error('Personal not exists')
			}

			const personalData = personalDataList.find((data: ObtainDataPersonalDTO) => data.ci === updateDocumentDTO.ciPersonal);
			if (!personalData) {
				throw new Error('cant not find persoanl with that ci');
			}
			//------- update con ci vacio ---------
			if(ciPersonal === ""){
				updateDocumentDTO.ciPersonal = findDocument.authorDocument.toString();
				const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO}, {new: true}).exec();
				return document
			}
	
			const { _idPersonal, name, ci, email, phone, nationality } = personalData;
			let authorDocument = {}; 
			authorDocument = { _idPersonal, name, ci, email, phone, nationality };

			const document = this.documentModel.findOneAndUpdate({ _id: id }, {$inc: {__v: 1}, ...updateDocumentDTO, authorDocument}, {new: true}).exec();
			console.log(document)
			return document
			
		}
	}

	async remove(id: string) {
		return this.documentModel.findByIdAndRemove({ _id: id}).exec();
	}

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
			
			console.log('esto es el dto de base64document')
			console.log(base64DocumentResponseDTO)
			return base64DocumentResponseDTO

		} catch (error) {
			throw new GatewayTimeoutException('Something bad hapened', {cause: new Error(), description: 'cannot get a response in time with the external service'});
			
		}
	  }

	}
}