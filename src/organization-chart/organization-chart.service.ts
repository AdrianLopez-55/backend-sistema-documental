import { HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { ObtainOrganigramaDataDto } from './dto/organigrama-resultt.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class OrganizationChartService {
  constructor(private readonly httpService: HttpService) {}
  private readonly baseUrl: string = `${process.env.API_ORGANIZATION_CHART_MAIN}`;
  private readonly baseUrlId: string = `${process.env.API_ORGANIZATION_CHART_ID}`;

  public async findAll(url: string): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener los datos de organization chart');
    }
  }

  public async findById(id: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrlId}/${id}`);
      if (!response) {
        throw new HttpException(`no se encontro la oficina: ${id}`, 404);
      }
      return response.data;
    } catch (error) {
      throw new HttpException('error al obtener los datos', 500);
    }
  }

  public async findByName(name: string): Promise<any> {
    const url = `${
      process.env.API_ORGANIZATION_CHART_MAIN
    }?name=${encodeURIComponent(name)}`;

    try {
      const response = await this.httpService.get(url).toPromise();
      const exactName = response.data.find((result) => result.name === name);
      return exactName;
    } catch (error) {
      throw new HttpException('error al obtener los datos service', 500);
    }
  }
}
