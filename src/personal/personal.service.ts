// import { HttpException, Injectable } from '@nestjs/common';
// import axios from 'axios';
// import getConfig from '../config/configuration';
// import { ObtainDataPersonalDTO } from './dto/personal-result.dto';
// import { HttpService } from '@nestjs/axios';

// @Injectable()
// export class PersonalService {
//   constructor(private readonly httpService: HttpService) {}

//   public async fetchDataFromExternalServer(url: string): Promise<any> {
//     try {
//       const response = await axios.get(url);
//       return response.data;
//     } catch (error) {
//       throw new Error('Error al obtener datos del servidor externo');
//     }
//   }

//   public async fetchDataFromExternalServerById(
//     personalId: string,
//   ): Promise<any> {
//     const url = `${getConfig().api_personal_get}/${personalId}`;
//     try {
//       const data = await this.fetchDataFromExternalServer(url);
//       const { _id, name, ci, email, phone, nationality } = data;
//       const obtainDataPersonalDTO: ObtainDataPersonalDTO = {
//         ...ObtainDataPersonalDTO,
//         _idPersonal: _id,
//         name: name,
//         ci: ci,
//         email: email,
//         phone: phone,
//         nationality: nationality,
//       };
//       return obtainDataPersonalDTO;
//     } catch (error) {
//       throw new HttpException(
//         'Error al obtener datos del servidor externo',
//         404,
//       );
//     }
//   }

//   public async fetchDataFromExternalServerByCi(
//     personalCi: string,
//   ): Promise<any> {
//     const url = `${process.env.API_PERSONAL_GET}?ci=${encodeURIComponent(
//       personalCi,
//     )}`;
//     try {
//       const response = await this.httpService.get(url).toPromise();
//       const personalDataList = response.data;
//       if (personalDataList.length === 0) {
//         throw new HttpException('No se encontró el personal', 404);
//       }

//       const personalData = personalDataList.find(
//         (data: ObtainDataPersonalDTO) => data.ci === personalCi,
//       );
//       if (!personalData) {
//         throw new HttpException('No se encontró el personal', 404);
//       }
//       const { _idPersonal, name, ci, email, phone, nationality } = personalData;
//       let authorDocument = {};
//       authorDocument = { _idPersonal, name, ci, email, phone, nationality };
//       return personalData;
//     } catch (error) {
//       throw new Error('Error al obtener los datos del personal');
//     }
//   }
// }
