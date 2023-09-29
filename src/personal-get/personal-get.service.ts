import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import getConfig from '../config/configuration';
import axios from 'axios';
import { ObtainDataPersonalGetDto } from './dto/personal-get-result.dto';

@Injectable()
export class PersonalGetService {
  private readonly apiPersonalGet = getConfig().api_personal_get;

  constructor(private readonly httpService: HttpService) {}

  public async fetchDataFromPersonalServer(url: string): Promise<any> {
    try {
      const response = await this.httpService
        .get(`${this.apiPersonalGet}`)
        .toPromise();
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener datos del servidor externo',
        404,
      );
    }
  }

  public async fetchDataFromPersonalServerById(
    personalId: string,
  ): Promise<any> {
    const url = `${this.apiPersonalGet}/${personalId}`;
    try {
      const data = await this.fetchDataFromPersonalServer(url);
      const { _id, name, lastName, ci, email, unity } = data;
      const obtainDataPersonalGetDto: ObtainDataPersonalGetDto = {
        ...ObtainDataPersonalGetDto,
        _idPersonal: _id,
        name: name,
        ci: ci,
        email: email,
        unity: unity,
      };
      return obtainDataPersonalGetDto;
    } catch (error) {
      throw new HttpException(
        'Error al obtener datos del servicio externo',
        404,
      );
    }
  }
  public async fetchDataFromPersonalServerByCi(
    personalCi: string,
  ): Promise<any> {
    const url = `${this.apiPersonalGet}?ci=${encodeURIComponent(personalCi)}`;
    try {
      const response = await this.httpService.get(url).toPromise();
      const personalDataList = response.data;
      if (personalDataList.length === 0) {
        throw new HttpException('No se encontro el personal', 404);
      }
      const personalData = personalDataList.find(
        (data: ObtainDataPersonalGetDto) => data.ci === personalCi,
      );
      if (!personalData) {
        throw new HttpException('no se encontro el personal', 404);
      }
      const { _idPersonal, name, lastName, ci, email, unity } = personalData;
      let authorDocument = {};
      authorDocument = { _idPersonal, name, lastName, ci, email, unity };
      return personalData;
    } catch (error) {
      throw new HttpException('error al obtener los datos del personal', 404);
    }
  }
}
