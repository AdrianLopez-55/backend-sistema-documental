import { Body, Controller, Post, Req, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { Base64DocumentDto, Base64FileUploadDTO } from './dto/base64-document.dto';
import { Base64DocumentService } from './base64-document.service'
import { Response, Request, response } from 'express';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration'
import { Base64DocumentResponseDTO } from './dto/base64-document-response.dto';


@Controller('base64-document')
export class Base64DocumentController {
	constructor(
		private readonly base64DocumentService: Base64DocumentService,
		private httpService: HttpService
		){}
	//private readonly apiFilesUploader = process.env.API_FILES_UPLOADER;
	
	@Post('base64-Send')
	@ApiTags('Send Base64 File')
	@ApiOkResponse({description: 'file upload correctly'})
	@ApiOperation({summary: 'send base64 file'})
	@ApiBadRequestResponse({description: 'cannot process the request, check your data', type: Base64FileUploadDTO})
	async uploaderFiles(@Req() req: Request, @Res() res: Response, @Body() base64FileUploadDTO:Base64FileUploadDTO){
		const response = await this.base64DocumentService.filesUploader(base64FileUploadDTO, res);
		// console.log(base64FileUploadDTO)
		console.log('se envio el base64 y se recibio algo')
		// console.log(response)
		res.send(response)
		console.log(response)
		return response;
		} catch (error){
		//   console.log('Error al enviar el base64', error)
		  throw new BadRequestException('Something data is bad send', {cause: new Error(), description: 'cannot process the request, check your data'})
		//   return res.
		}
	}
	/*
	async uploaderFiles(@Req() req: Request, @Res() res: Response, @Body() base64FileUploadDTO: Base64FileUploadDTO){
		const { file } = base64FileUploadDTO;
		if(file){
			const mimeType = file.split(';')[0].split(':')[1].split('/')[1];
			const base64 = file.split(',')[1];

			const fileObj = {
				mime: mimeType,
				base64: base64
			};
			try{
				// console.log(base64DocumentDto)
				const response = await this.base64DocumentService.filesUploader(base64FileUploadDTO);
				
				//envio compartido
				// const response = await this.httpService.post(`${getConfig().file_upload}/files/upload`, {file: fileObj}).toPromise()
				// console.log('subio el archivo con exito');
				// console.log(response)
				// res.send(response)
				base64FileUploadDTO = {...Base64DocumentResponseDTO, file_id:response.data.file._id, filename:response.data.file.filename}
				console.log(base64FileUploadDTO)
			  } catch (error){
				  console.log(error)
				  throw error
			  }
		}
		// const createFile = await this.base64DocumentService.create(base64FileUploadDTO);
		res.status(200).send(base64FileUploadDTO)
		}
		*/
	




	// 	try {
	// 	const response = await axios.post(`${this.apiFilesUploader}/files/upload`, {
	// 		mime, 
	// 		base64
	// 	});
	// 	const {_id, filename, category} = response.data;
	// 	return {
	// 		_id,
	// 		filename,
	// 		category,
	// 	};
	// } catch (error){
	// 	console.log(error)
	// 	throw new Error('Error al procesar doucmento')
	// }
	// }

//}

