import { HttpService } from '@nestjs/axios';
import { Body, Injectable } from '@nestjs/common';
import { Base64DocumentDto } from './dto/base64-document.dto';
import { Documents } from 'src/documents/schema/documents.schema';
import { Base64DocumentResponseDTO } from './dto/base64-document-response.dto';
//import { Base64DocumentResponseDTO } from './dto/base64-document-response.dto';

@Injectable()
export class Base64DocumentService {
	private readonly apiFilesUploader = process.env.API_FILES_UPLOADER
	constructor(private readonly httpService: HttpService) {}

	async filesUploader(base64DocumentDto:Base64DocumentDto) {
		// try {
		// 	const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, base64DocumentDto).toPromise();
		// 	const fileData: Base64DocumentResponseDTO = response.data
		// 	return fileData
		// } catch (error) {
		// 	throw error.response?.data
		// }

		try {
			const response = await this.httpService.post(`${this.apiFilesUploader}/files/upload`, base64DocumentDto).toPromise()
			const { _id, filename, size, filePath, status, category, extension } = response.data.file;

			const base64DocumentResponseDTO: Base64DocumentResponseDTO = {
				_id: _id,
				filename: filename,
				extension: extension,
				size: size,
				filePath: filePath,
				status: status,
				category: category,
				mime: base64DocumentDto.file.mime,
				base64: base64DocumentDto.file.base64

			}
			// const updateDocument = await documentModel
			return base64DocumentResponseDTO
		} catch (error) {
			throw error.response?.data
		}
	  }

}
