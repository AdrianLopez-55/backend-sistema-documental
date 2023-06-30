import { Injectable } from '@nestjs/common';
import axios from 'axios';
import getConfig from '../config/configuration'
import { SendIDPersonalDTO } from './dto/personal.dto';
import { ObtainDataPersonalDTO } from './dto/personal-result.dto';

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
		const url = `${getConfig().api_personal_get}/${personalId}`;
		try {
			const data = await this.fetchDataFromExternalServer(url);
			const { _id, name, ci, email, phone, nationality } = data
			const obtainDataPersonalDTO: ObtainDataPersonalDTO = {
				...ObtainDataPersonalDTO,
				_id: _id,
				name: name,
				ci: ci,
				email: email,
				phone: phone,
				nationality: nationality,
			}
			
			console.log(data);
			console.log('lo que recibira el front')
			console.log(obtainDataPersonalDTO)
			return obtainDataPersonalDTO
			// return response.data;
		} catch (error) {
			throw new Error('Error al obtener datos del servidor externo')
		}
	}



}
