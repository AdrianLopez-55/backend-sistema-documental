import { HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { ObtainOrganigramaDataDto } from './dto/organigrama-resultt.dto';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';

@Injectable()
export class OrganizationChartService {
  constructor(private readonly httpService: HttpService) {}
  private readonly apiOrganizationChartMain =
    getConfig().api_organization_chart_main;
  private readonly apiOrganizationChartId =
    getConfig().api_organization_chart_id;
  private readonly baseUrl: string = `${
    getConfig().api_organization_chart_main
  }`;
  private readonly baseUrlId: string = `${
    getConfig().api_organization_chart_id
  }`;

  public async findAll(url: string): Promise<any> {
    try {
      const response = await axios.get(this.apiOrganizationChartMain);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener los datos de organization chart');
    }
  }

  public async findById(id: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiOrganizationChartId}/${id}`);
      if (!response) {
        throw new HttpException(`no se encontro la oficina: ${id}`, 404);
      }
      return response.data;
    } catch (error) {
      throw new HttpException('error al obtener los datos', 500);
    }
  }

  public async findByName(name: string): Promise<any> {
    const url = `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
      name,
    )}`;

    try {
      const response = await this.httpService.get(url).toPromise();
      const exactName = response.data.find((result) => result.name === name);
      return exactName;
    } catch (error) {
      throw new HttpException('error al obtener los datos service', 500);
    }
  }
}
