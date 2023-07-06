import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { LoginCentralAuthDTO } from './api.dto';

@Injectable()
export class ApiService {
	private readonly apiSeguridad = process.env.API_CENTRAL
	constructor(private readonly httpService: HttpService) {}

	  async loginAuthCentral(loginCentralAuthDTO:LoginCentralAuthDTO) {
		try {
			const response = await this.httpService.post(`${this.apiSeguridad}/auth/verify-app-token`, loginCentralAuthDTO).toPromise()
			console.log(response)
			console.log(response.data)
			return response.data
		} catch (error) {
			throw error.response?.data
		}
	  }
	}
