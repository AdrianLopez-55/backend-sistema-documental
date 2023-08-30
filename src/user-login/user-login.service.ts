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
      console.log('esto es userRol');
      // console.log(userRol);
      const allRolUser = userRol.map((data) => data);
      const obtainDAtaRolAll = await this.getMultipleDataByIds(allRolUser);
      const rolUser = obtainDAtaRolAll.map((response) => response.data.rolName);

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
