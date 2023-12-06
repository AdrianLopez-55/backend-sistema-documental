import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import getConfig from './config/configuration';

@Injectable()
export class UserService {
  constructor(private readonly httpService: HttpService) {}

  async getPermissionsFromToken(token: string) {
    try {
      const decodedToken = await this.httpService
        .post(`${getConfig().api_central}/auth/decoded`, { token })
        .toPromise();
      // console.log(decodedToken.data);

      const dataUser = await this.httpService
        .get(`${getConfig().api_personal_get}/${decodedToken.data.idUser}`)
        .toPromise();
      return {
        _id: dataUser.data._id,
        name: dataUser.data.name,
        lastName: dataUser.data.lastName,
        email: dataUser.data.email,
      };
    } catch (error) {
      // throw Error(error);
      console.log(error);
      throw error.response?.data;
    }
  }
}
