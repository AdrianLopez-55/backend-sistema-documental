import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { LoginCentralAuthDTO } from './api.dto';

@Injectable()
export class ApiService {
	private readonly apiSeguridad = process.env.API_CENTRAL
	constructor(
		private readonly httpService: HttpService,
	) {}

	// async serviceApiDocumental(){
	// 	return "hello from services"
	// }

	// async loginAuthDocumental(loginAuthDocumentalDTO:LoginCentralAuthDTO):Promise<Observable<AxiosResponse<any[]>>>{
	// 	console.log(loginAuthDocumentalDTO)
	// 	const response = await this.httpService.post(`${this.apiSeguridad}`,loginAuthDocumentalDTO).toPromise();
	// 	return response.data
	//   }

	  async loginAuthCentral(loginCentralAuthDTO:LoginCentralAuthDTO) {
		try {
			const response = await this.httpService.post(`${this.apiSeguridad}/auth/verify-app-token`, loginCentralAuthDTO).toPromise()
			return response.data
		} catch (error) {
			throw error.response?.data
		}
		// console.log(loginCentralAuthDTO)
		// const response = await this.httpService.post(`${this.apiSeguridad}/auth/verifyAppToken`,loginCentralAuthDTO).toPromise();
		// return response.data
	  }
	}
