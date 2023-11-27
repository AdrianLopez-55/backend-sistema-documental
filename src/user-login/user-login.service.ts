import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import getConfig from '../config/configuration';

@Injectable()
export class UserLoginService {
  private readonly apiPersonalGet = getConfig().api_personal_get;
  private readonly apiRolId = getConfig().api_rol_id;

  constructor(private readonly httpService: HttpService) {}

  async getUserLogged(userId: string, userRol: string[]) {
    try {
      const urlPersonal = await this.httpService
        .get(`${this.apiPersonalGet}/${userId}`)
        .toPromise();
      console.log('sdf', urlPersonal);
      const allRolUser = userRol.map((data) => data);

      const obtainDAtaRolAll = await this.getMultipleDataByIds(allRolUser);
      const rolUser = obtainDAtaRolAll.map((response) => response.data.rolName);

      const { _id, name, lastName, ci, email, unity, file } = urlPersonal.data;
      if (file === '') {
        const dataPersonalLogged = {
          _id,
          name,
          lastName,
          ci,
          email,
          unity,
          file: '',
          rolUser,
        };
        return dataPersonalLogged;
      }

      const fileData = await this.httpService
        .get(`${getConfig().api_files_uploader}/file/${file}`)
        .toPromise();
      if (fileData) {
      }
      const dataPersonalLogged = {
        _id,
        name,
        lastName,
        ci,
        email,
        unity,
        file: fileData.data.file.base64,
        rolUser,
      };

      return dataPersonalLogged;
    } catch (error) {
      console.log(error);
      throw new HttpException(`usuario no conectado${error}`, 500);
    }
  }

  async getMultipleDataByIds(ids: string[]): Promise<any[]> {
    const dataPromise = ids.map(
      async (id) =>
        await this.httpService.get(`${this.apiRolId}/${id}`).toPromise(),
    );
    return Promise.all(dataPromise);
  }
}
