import { Injectable, Res, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LoginCentralAuthDTO } from './api.dto';
import { Response } from 'express';
import getConfig from '../config/configuration';
import { User } from '../interfaces/user.interface';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class ApiService {
  private readonly apiSeguridad = getConfig().api_central;
  private authenticatedUser: User;
  constructor(private readonly httpService: HttpService) {}

  setAuthenticatedUser(user: User): void {
    this.authenticatedUser = user;
  }

  async loginAuthCentral(
    loginCentralAuthDTO: LoginCentralAuthDTO,
    @Res() res: Response,
  ) {
    try {
      console.log('Llamando a loginAuthCetnral');
      const { app, token } = loginCentralAuthDTO;
      const response = await this.httpService
        .post(`${this.apiSeguridad}/auth/verify-app-token`, loginCentralAuthDTO)
        .toPromise();
      res.status(200).send(response.data);
      // return response.data;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        res.status(status).send(data);
      } else {
        throw new HttpException('ocurrio un error', 500);
      }
      throw error.decodeToken?.data;
    }
  }

  getAuthenticatedUser(): User {
    console.log('esto es authenticatedUser de getAuthenticatedUser');
    console.log(this.authenticatedUser);
    return this.authenticatedUser;
  }

  async loginAuthDocumental(
    loginAuthDocumentalDTO: LoginCentralAuthDTO,
  ): Promise<Observable<AxiosResponse<any[]>>> {
    console.log(loginAuthDocumentalDTO);
    const response = await this.httpService
      .post(
        `${this.apiSeguridad}/auth/verify-app-token`,
        loginAuthDocumentalDTO,
      )
      .toPromise();
    return response.data;
  }

  async loginAuthCentralTest(loginCentralDTO: LoginCentralAuthDTO) {
    try {
      const response = await this.httpService
        .post(`${this.apiSeguridad}/auth/verify-app-token`, loginCentralDTO)
        .toPromise();
      return response.data;
    } catch (error) {
      throw error.response?.data;
    }
  }
}
