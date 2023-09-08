import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class UserLoginService {
  constructor(private readonly httpService: HttpService) {}

  async getUserLogged(userId: string, userRol: string[]) {
    try {
      const urlPersonal = await this.httpService
        .get(`${process.env.API_PERSONAL_GET}/${userId}`)
        .toPromise();
      // console.log('esto es userRol');
      // console.log(userRol);
      // console.log('esto son los datos del usuario');
      // console.log(urlPersonal.data);
      const allRolUser = userRol.map((data) => data);
      const obtainDAtaRolAll = await this.getMultipleDataByIds(allRolUser);
      const rolUser = obtainDAtaRolAll.map((response) => response.data.rolName);
      // console.log(urlPersonal.data);
      console.log('esto es rolUser');
      console.log(rolUser);

      const { _id, name, lastName, ci, email, unity } = urlPersonal.data;

      const dataPersonalLogged = {
        _id,
        name,
        lastName,
        ci,
        email,
        unity,
        rolUser,
      };
      console.log('datos finales del usuario');
      console.log(dataPersonalLogged);

      return dataPersonalLogged;
    } catch (error) {
      throw new HttpException('usuario no conectado', 500);
    }
  }

  async getMultipleDataByIds(ids: string[]): Promise<any[]> {
    const dataPromise = ids.map(
      async (id) =>
        await this.httpService
          .get(`${process.env.API_ROL_ID}/${id}`)
          .toPromise(),
    );
    return Promise.all(dataPromise);
  }
}