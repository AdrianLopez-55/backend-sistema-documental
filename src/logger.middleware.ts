import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
import { Request, Response, NextFunction } from 'express';
// import { Model } from 'mongoose';
// import { Bitacora, BitacoraDocument } from 'src/bitacora/schema/bitacora.schema';
import getConfig from './config/configuration'
// import { CustomErrorService } from 'src/error.service';

declare global {
	namespace Express {
	  interface Request {
		userPersonalData: any; // Cambia 'any' por el tipo correcto de tus datos personales
	  }
	}
  }

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    private httpService:HttpService,    
    // @InjectModel(Bitacora.name) private readonly bitacoraModel: Model<BitacoraDocument>,
    // private customErrorService:CustomErrorService,

    ){}

  async use(req: Request, res: Response, next: NextFunction) {
    
    const authorizationHeader = req.headers.authorization;
    
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.split(' ')[1 ];
    
    //   let dataPersonal
      try {
        const res = await this.httpService.post(`${getConfig().verify_token}auth/decoded`,{ token }).toPromise()
        // res.data.idUser

        req.user = res.data.idUser

        const resPersonal = await this.httpService.get(`${getConfig().api_personal}api/personal/${res.data.idUser}`).toPromise()
        // dataPersonal=resPersonal.data

        // const idMatch = req.url.match(/\/([^/]+)$/);
        // const id = idMatch && idMatch[1] ? idMatch[1] : null;

    //   let description = '';
    //     switch (req.method) {
    //       case 'POST':
    //         if (req.path === '/get-ufv') {
    //           description = `solicito ufvs a la bcb`;
    //         } else if (req.path === '/asset') {
    //           description = `creo un activo`;
    //         } else if(req.path === '/depreciation-asset-list') {
    //           description = `creo un grupo contable: ${req.body.assetCategory}`;
    //         } else if(req.path === '/supplier'){
    //           description = 'creo un proveedor';
    //         }else if(req.path === '/api/redirect-to-main'){
    //           description = 'inicio sesion en la app activos';
    //         }else if(req.path === '/permission'){
    //           description = 'creo un permiso';
    //         }if(req.path === '/delivery'){
    //           description = `realizo entrega del activo ${req.body.assetId}`;
    //         }

    //         break;
    //       case 'PUT':
    //         if (req.path.startsWith('/asset')){
    //           description = `actualizo un activo con id: ${id}`
    //         }else if (req.path.startsWith('/depreciation-asset-list')){
    //           description = `actualizo un grupo contable con id: ${id}`
    //         }else if (req.path.startsWith('/supplier/update')){
    //           description = `actualizo un proveedor con id: ${id}`
    //         }else if (req.path.startsWith('/supplier/restart-supplier')){
    //           description = `restauro un proveedor con id: ${id}`
    //         }else if (req.path.startsWith('/permission')){
    //           description = `actualizo un permiso con el id: ${id}`
    //         }else if (req.path.startsWith('/delivery')){
    //           description = `actualizo la entrega con el id: ${id}`
    //         }
    //         break;
    //       case 'DELETE':
    //         if (req.path.startsWith('/asset')){
    //           description = `elimino un activo con id: ${id}`;
    //         }else if (req.path.startsWith('/depreciation-asset-list')){
    //           description = `elimino un grupo contable con id: ${id}`
    //         }else if (req.path.startsWith('/supplier')){
    //           description = `elimino un proveedor con id: ${id}`
    //         }else if (req.path.startsWith('/permission')){
    //           description = `elimino un permiso con id: ${id}`
    //         }else if (req.path.startsWith('/delivery')){
    //           description = `elimino la entrega con id: ${id}`
    //         }
            
    //         break;
    //       default:
    //         description = 'peticion de Get';
    //         break;
    //     }
        
        // if(req.method == 'GET'){
        //   next()
        //   return 
        // }
        
        // const bitacoraEntry = new this.bitacoraModel({
        //   user: dataPersonal.email, 
        //   action: `Método: ${req.method}`,
        //   description,
        //   path:`${req.headers['origin']}${req.url}`,
        // });

        // await bitacoraEntry.save();

		req.userPersonalData = resPersonal.data

      } catch (error) {
        throw error.response?.data
      }
    } else {
    //   this.customErrorService.customResponse(HttpStatus.UNAUTHORIZED, true, 'acceso no autorizado','ingrese token para realizar las distintas acciones')
		throw new HttpException('no autorizado', 401)
    }

    next();
  }
}