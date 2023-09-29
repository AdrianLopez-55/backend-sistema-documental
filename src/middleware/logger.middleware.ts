import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import getConfig from '../config/configuration';
import { CustomErrorService } from 'src/error.service';
import {
  Bitacora,
  BitacoraDocuments,
} from 'src/bitacora/schema/bitacora.schema';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    private httpService: HttpService,
    @InjectModel(Bitacora.name)
    private readonly bitacoraModel: Model<BitacoraDocuments>,
    private customErrorService: CustomErrorService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.split(' ')[1];

      let dataPersonal;
      try {
        const res = await this.httpService
          .post(`${getConfig().verify_token}/auth/decoded`, { token })
          .toPromise();
        res.data.idUser;
        req.user = res.data.idUser;
      } catch (error) {
        throw error.response?.data;
      }
    } else {
      this.customErrorService.customResponse(
        HttpStatus.UNAUTHORIZED,
        true,
        'acceso no autorizado',
        'ingrese token para realizar las distintas acciones',
      );
    }

    next();
  }
}
