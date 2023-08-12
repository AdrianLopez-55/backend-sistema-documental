import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LoginCentralAuthDTO } from './api.dto';
import getConfig from '../config/configuration';
import { User } from '../interfaces/user.interface';

@Injectable()
export class ApiService {
  private readonly apiSeguridad = process.env.API_CENTRAL;
  private authenticatedUser: User;
  constructor(private readonly httpService: HttpService) {}

  setAuthenticatedUser(user: User): void {
    this.authenticatedUser = user;
  }

  
  async loginAuthCentral(loginCentralAuthDTO: LoginCentralAuthDTO, request: any) {
    try {
      console.log('Llamando a loginAuthCetnral');
      const response = await this.httpService
        .post(`${this.apiSeguridad}/auth/verify-app-token`, loginCentralAuthDTO)
        .toPromise();
      
      const token = response.data
      const decodeToken = await this.httpService
      .post(`${this.apiSeguridad}/auth/decoded`, {token: token})
      .toPromise();
      const idPersonal = decodeToken.data.idUser
      const obtainDataPersonal = await this.httpService
      .get(`${getConfig().api_personal}/api/personal/${idPersonal}`)
      .toPromise();
      const { _id, name } = obtainDataPersonal.data

      const user = { _idPersonal: _id, name };

      this.setAuthenticatedUser(user);
      console.log('esto es "user" de apiservice')
      console.log(user)

      // Agrega los datos personales del usuario al contexto de la solicitud
      request.user = user;

      console.log('esto es request de apiservice');
      console.log(request);
      return response.data;
    } catch (error) {
      throw error.decodeToken?.data
    }
  }

  getAuthenticatedUser(): User {
    console.log('esto es authenticatedUser de getAuthenticatedUser')
    console.log(this.authenticatedUser)
    return this.authenticatedUser;
  }
}
