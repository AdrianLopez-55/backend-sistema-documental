import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiService } from './api.service';
import { LoginCentralAuthDTO } from './api.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('validate user')
@Controller('api')
export class ApiController {
	constructor(
		private apiService:ApiService
	){}

	// @Post("auth-documental-login")
	// async authLogin(@Res() res:Response,@Body() loginAuthDocumentalDTO:LoginCentralAuthDTO){
	// 	const response =  await this.apiService.loginAuthDocumental(loginAuthDocumentalDTO)
	// 	return res.status(HttpStatus.OK).json({response});
	// }

 @Post('login-central')
  async loginCentral(@Req() req: Request, @Res() res: Response, @Body() loginCentralAuthDTO: LoginCentralAuthDTO){
    try{
      console.log(loginCentralAuthDTO)
      const response = await this.apiService.loginAuthCentral(loginCentralAuthDTO)
	  console.log('login realizado con exito')
	  res.send(response);
    } catch (error){
		console.log(error)
		throw error
	}
  }
}
