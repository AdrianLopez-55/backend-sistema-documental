// import { HttpService } from '@nestjs/axios';
// import { Body, GatewayTimeoutException, Injectable } from '@nestjs/common';
// import { Base64DocumentDto, Base64FileUploadDTO } from './dto/base64-document.dto';
// import { Base64DocumentResponseDTO } from './dto/base64-document-response.dto';
// import { InjectModel } from '@nestjs/mongoose';
// import { Base64File, Base64FileDocument } from './schema/base64-document.schema';
// import { Model } from 'mongoose';
// //import { Base64DocumentResponseDTO } from './dto/base64-document-response.dto';
// import * as mimeTypes from 'mime-types';
// import { error } from 'console';
// import { Request, Response } from 'express';

// @Injectable()
// export class Base64DocumentService {
// 	private readonly apiFilesUploader = process.env.API_FILES_UPLOADER
// 	constructor(
// 		//@InjectModel(Base64File.name) private readonly base64FileModel: Model<Base64FileDocument>,
// 		private readonly httpService: HttpService,
// 		) {}

// 	async filesUploader(base64FileUploadDTO:Base64FileUploadDTO, res: Response) {
// 		// try {
// 		// 	const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, base64DocumentDto).toPromise();
// 		// 	const fileData: Base64DocumentResponseDTO = response.data
// 		// 	return fileData
// 		// } catch (error) {
// 		// 	throw error.response?.data
// 		// }

// 		const { file } = base64FileUploadDTO
// 		if(file){
// 			const mimeType = file.split(';')[0].split(':')[1];
// 			const base64 = file.split(',')[1];
// 			// const buffer = Buffer.from(base64, 'base64');
			
			
// 			// const customExtension = {
// 			// 	txt: 'file/plain',
				
// 			// 	//Extensiones de archivo de imagen:
// 			// 	jpg: 'file/jpg', 
// 			// 	jpeg: 'file/jpeg',
// 			// 	png: 'file/png',
// 			// 	gif: 'file/gif',
// 			// 	bmp: 'file/bmp',
// 			// 	svg: 'file/svg+xml',
				
// 			// 	// Extensiones de archivo de audio:
// 			// 	// mp3: audio/mpeg,
// 			// 	// wav: audio/wav,
// 			// 	// ogg: audio/ogg,
				
// 			// 	// Extensiones de archivo de video:
// 			// 	// mp4: video/mp4,
// 			// 	// avi: video/x-msvideo,
// 			// 	// mov: video/quicktime,
				
// 			// 	//Extensiones de archivo de documento:
// 			// 	docx: 'file/vnd.openxmlformats-officedocument.wordprocessingml.documen',
// 			// 	xlsx: 'file/vnd.openxmlformats-officedocument.wordprocessingml.excel',
// 			// 	pptx: 'file/vnd.openxmlformats-officedocument.wordprocessingml.powerpoint',
// 			// 	pdf: 'file/pdf',

// 			// 	//Extensiones de archivo comprimido:
// 			// 	zip: 'file/zip',
// 			// 	rar: 'file/x-rar-compressed',
// 			// 	tar: 'file/x-tar',
// 			// 	gz: 'file/gzip',
// 			// }

// 			// let extension: string | undefined;

// 			// for (const ext in customExtension){
// 			// 	if(customExtension[ext] === mimeTypes){
// 			// 		extension = ext;
// 			// 		break;
// 			// 	}
// 			// }

// 			// const extension = 'buff';
			
// 			// const mimeType = customExtension[extension] || mimeTypes.lookup(buffer)
			
			
// 			const fileObj = {
// 				mime: mimeType,
// 				base64: base64
// 			}

// 		try {
// 			const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise()
// 			const { _id, filename, size, filePath, status, category, extension } = response.data.file;

// 			const base64DocumentResponseDTO: Base64DocumentResponseDTO = {
// 				_id: _id,
// 				filename: filename,
// 				extension: extension,
// 				size: size,
// 				filePath: filePath,
// 				status: status,
// 				category: category,
// 			}
// 			// const updateDocument = await documentModel
// 			return base64DocumentResponseDTO
// 		} catch (error) {
			
// 			// throw error.response?.data
// 			throw new GatewayTimeoutException('Something bad hapened', {cause: new Error(), description: 'cannot get a response in time with the external service'});
			
// 		}
// 	  }

// 	// async create(base64FileUploadDTO: Base64FileUploadDTO){
// 	// 	return await this.base64FileModel.create(base64FileUploadDTO)
// 	// }
// 	}
// }
