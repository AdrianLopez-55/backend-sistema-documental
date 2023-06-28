import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PersonalService {
	public async fetchDataFromExternalServer(url: string): Promise<any>{
		try {
			const response = await axios.get(url);
			return response.data;
		} catch (error) {
			throw new Error('Error al obtener datos del servidor externo')
		}
	}

	public async fetchDataFromExternalServerById(personalId: string): Promise<any>{
		const url = `${process.env.API_PERSONAL_GET}/${personalId}`;
		try {
			const data = await this.fetchDataFromExternalServer(url);
			const { name, ci, email, phone, nationality } = data
			console.log(data);
			return {
				name,
				ci,
				email,
				phone,
				nationality
			}
			// return response.data;
		} catch (error) {
			throw new Error('Error al obtener datos del servidor externo')
		}
	}

}
