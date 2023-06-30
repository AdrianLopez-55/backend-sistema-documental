import { Injectable } from '@nestjs/common';
import axios from 'axios';
import getConfig from '../config/configuration'
import { SendIDPersonalDTO } from './dto/personal.dto';
import { ObtainDataPersonalDTO } from './dto/personal-result.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class PersonalService {
	constructor(private readonly httpService: HttpService){}

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
				_idPersonal: _id,
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

	public async fetchDataFromExternalServerByCi(personalCi: string): Promise<any>{
		const url = `${process.env.API_PERSONAL_GET}?ci=${encodeURIComponent(personalCi)}`;
		console.log('esto es url')
		console.log(url);
		try {
			const response = await this.httpService.get(url).toPromise();
			const personalDataList = response.data
			if(personalDataList.length === 0){
				throw new Error('No se encontró el personal')
			}

			const personalData = personalDataList.find((data: ObtainDataPersonalDTO) => data.ci === personalCi);
			if (!personalData) {
				throw new Error('No se encontró el personal');
			}
			// console.log('esto es personalDataList de personal')
			// console.log(personalDataList)
			console.log('esto es obtainDataPersonalDTO')
			console.log(ObtainDataPersonalDTO)
			console.log('esto es personalData')
			console.log(personalData)
			const { _idPersonal, name, ci, email, phone, nationality } = personalData
			let authorDocument = {}; 
			authorDocument = { _idPersonal, name, ci, email, phone, nationality };
			console.log('authorDocument')
			console.log(authorDocument)


			return personalData;  
		} catch (error) {
			throw new Error('Error al obtener los datos del personal');
		  }
		// const response = await axios.get(`${process.env.API_PERSONAL_GET}`, {
		// 	params: {
		// 		ci: personalCi
		// 	}
		// });
		// if(response.data && response.data.length > 0){
		// 	const personalData = response.data[0];
		// 	const mappedData: ObtainDataPersonalDTO = {
		// 		_id: personalData._id,
		// 		name: personalData.name,
        //   		ci: personalData.ci,
        //   		email: personalData.email,
        //   		phone: personalData.phone,
        //   		nationality: personalData.nationality
		// 	};
		// 	console.log(mappedData)
		// 	return mappedData
		// } else {
		// 	throw new Error('No se encontraron datos del personal con el nombre especificado');
		// }
	}



}
