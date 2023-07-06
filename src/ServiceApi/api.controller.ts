import { Body, Controller, HttpException, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiService } from './api.service';
import { LoginCentralAuthDTO } from './api.dto';
import { ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration'

@Controller('api')
@ApiTags('Validate Token')
export class ApiController {
	constructor(private apiService:ApiService,private readonly httpService: HttpService,){}

 @Post('login-central')
  async loginCentral(@Req() req: Request, @Res() res: Response, @Body() loginCentralAuthDTO: LoginCentralAuthDTO){
    try{
      console.log(loginCentralAuthDTO)
      const response = await this.apiService.loginAuthCentral(loginCentralAuthDTO)
	  console.log('token enviado con exito')
	  res.send(response);
	  res.status(200).send(response.data)
    } catch (error){
		console.log(error)
		throw error
	}
  }

//   @Post('/redirect-to-main')
//   async verifyToken(@Body() tokenObject:LoginCentralAuthDTO, @Res() res: Response){
// 	try{
// 		const response = await this.httpService.post(`${getConfig().verify_token}/auth/verify-app-token`, tokenObject).toPromise();
// 		res.status(200).send(response.data)
// 	} catch (error){
// 		if(error.response){
// 			const {status, data} = error.response;
// 			res.status(status).send(data);
// 		} else {
// 			throw new HttpException('ocurrio un problema', HttpStatus.INTERNAL_SERVER_ERROR);
// 		}
// 	}
//   }
}
