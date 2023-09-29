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

  public async findAll(url: string, tokenDat: string): Promise<any> {
    try {
      const response = await axios.get(this.apiOrganizationChartMain, {
        headers: {
          Authorization: `Bearer ${tokenDat}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener datos: ${error}`);
    }
  }

  public async findById(id: string, tokenDat: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiOrganizationChartId}/${id}`, {
        headers: {
          Authorization: `Bearer ${tokenDat}`,
        },
      });
      if (!response) {
        throw new HttpException(`no se encontro la oficina: ${id}`, 404);
      }
      return response.data;
    } catch (error) {
      throw new HttpException('error al obtener los datos', 500);
    }
  }

  public async findByName(name: string, tokenDat: string): Promise<any> {
    try {
      const response = await this.httpService
        .get(
          `${this.apiOrganizationChartMain}?name=${encodeURIComponent(name)}`,
          {
            headers: {
              Authorization: `Bearer ${tokenDat}`,
            },
          },
        )
        .toPromise();
      const exactName = response.data.find((result) => result.name === name);
      return exactName;
    } catch (error) {
      throw new HttpException('error al obtener los datos', 500);
    }
  }
}
