import { Body, Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { Base64DocumentDto } from './dto/base64-document.dto';
import { Base64DocumentService } from './base64-document.service'
import { Response, Request, response } from 'express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';


@Controller('base64-document')
export class Base64DocumentController {
	constructor(private readonly base64DocumentService: Base64DocumentService){}
	//private readonly apiFilesUploader = process.env.API_FILES_UPLOADER;
	
	@Post('base64-Send')
	@ApiTags('Send Base64 File')
	@ApiOkResponse({description: 'file upload correctly'})
	@ApiOperation({summary: 'send mime and base64 from a file'})
	async uploaderFiles(@Req() req: Request, @Res() res: Response, @Body() base64DocumentDto: Base64DocumentDto){
		try{
			console.log(base64DocumentDto)
			const response = await this.base64DocumentService.filesUploader(base64DocumentDto);
			console.log('subio el archivo con exito');
			console.log(response)
			res.send(response)
			return response;
		  } catch (error){
			  console.log(error)
			  throw error
		  }
		  
		}

	




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
}

