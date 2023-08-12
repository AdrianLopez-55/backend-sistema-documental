import { HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OrganizationChartService {
  private readonly baseUrl: string = `${process.env.API_ORGANIZATION_CHART_MAIN}`

  public async findAll(url: string): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener los datos de organization chart');
    }
  }

  public async findById(id: string): Promise<any>{
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`)
      if(!response){
        throw new HttpException(`no se encontro la oficina: ${id}`, 404)
      }
      return response.data;
    } catch (error) {
      throw new HttpException('error al obtener los datos', 500)
    }
  }
}
