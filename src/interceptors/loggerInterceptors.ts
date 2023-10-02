import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import {
  Bitacora,
  BitacoraDocuments,
} from 'src/bitacora/schema/bitacora.schema';
import getConfig from '../config/configuration';
import * as moment from 'moment-timezone';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    private httpService: HttpService,
    @InjectModel(Bitacora.name)
    private readonly botacoraModel: Model<BitacoraDocuments>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map(async (data) => {
        const resPersonal = await this.httpService
          .get(`${getConfig().api_personal_get}/${req.user}`)
          .toPromise();
        const dataPersonal = resPersonal.data;
        console.log('esto es data  por interceptor');
        console.log(data);

        let resPersonalDevolution;
        if (data.userId) {
          resPersonalDevolution = await this.httpService
            .get(`${getConfig().api_personal_get}/${data.userId}`)
            .toPromise();
        }
        let description = '';
        switch (req.method) {
          case 'POST':
            if (req.path === '/documents') {
              description = `creo un documento con id: ${data._id}`;
            } else if (
              req.path.startsWith('/documents/send-document-employeeds')
            ) {
              description = `Se envio un documento con id: ${data._id} a empleados (id: ${req.params.id})`;
            } else if (req.path.startsWith('/documents/send-document-unity')) {
              description = `Se envio un documento con id: ${data._id} a todos los usuarios de la unidad`;
            } else if (
              req.path.startsWith('/documents/send-document-without-workflow')
            ) {
              description = `se envio documento sin workflow con id: ${data._id} a usuario ${data.bitacoraWithoutWorkflow}`;
            } else if (
              req.path.startsWith('/documents/derive-document-employeed')
            ) {
              description = `se derivo documento ${data._id} a la siguiente unidad`;
            } else if (
              req.path.startsWith('/documents/derive-document-unity-all')
            ) {
              description = `se derivo docmento ${data._id} a todo el personal de la siguiente unidad`;
            } else if (
              req.path.startsWith('/documents/mark-document-observed')
            ) {
              description = `se observo el documento ${data._id}`;
            } else if (
              req.path.startsWith('/documents/mark-document-reviewed')
            ) {
              description = `se marco documento ${data._id} como revisado`;
            } else if (
              req.path.startsWith('/documents/mark-document-completed')
            ) {
              description = `se marco el documento ${data._id} como completado`;
            } else if (req.path.startsWith('/documents/comment')) {
              description = `se añadio un comentario al documento ${data._id}`;
            } else if (req.path.startsWith('/documents/milestone')) {
              description = `se añadio metadatos al documento ${data._id}`;
            } else if (req.path === '/digital-signature/generate') {
              description = `se genero clave privada y publica para el usuario ${data.userId}`;
            } else if (req.path === '/digital-signature/signature-document') {
              description = `se firmo un documento con id ${data._id}`;
            } else if (req.path === '/roadmap') {
              description = `se creo una hoja de ruta con id ${data._id}`;
            } else if (req.path === '/roadmap/assignedDocument') {
              description = `se añadio una hoja de ruta al documento con id ${data._id}`;
            }

            break;
          case 'PUT':
            if (req.path.startsWith('/documents')) {
              description = `documento actualizado con id ${data._id}`;
            } else if (req.path.startsWith('/documnts/active')) {
              description = `documento reactivado con id ${data._id}`;
            }
            // else if (req.path.startsWith('/documentation-type')) {
            //   description = `tipo de documento actualizado con id ${data._id}`;
            // } else if (req.path.startsWith('/documentation-type/activer')) {
            //   description = `tipo de documento reactivado con id ${data._id}`;
            // } else if (req.path.startsWith('/wotkflow')) {
            //   description = `flujo de trabajo actualizado con id ${data._id}`;
            // } else if (req.path.startsWith('/workflow/activer')) {
            //   description = `flujo de trabajo reactivado con id ${data._id}`;
            // } else if (req.path.startsWith('/step')) {
            //   description = `step actualizado con id ${data._id}`;
            // } else if (req.path.startsWith('/step/update-only-paso')) {
            //   description = `paso actualizado de un step con id ${data._id}`;
            // } else if (req.path.startsWith('/step/activer')) {
            //   description = `step reactivado con id ${data._id}`;
            // } else if (req.path.startsWith('/roadmap')) {
            //   description = `hoja de ruta actualizada con id ${data._id}`;
            // }

            break;
          case 'DELETE':
            if (req.path.startsWith('/documents/inactive')) {
              description = `documento inactivado o archivado con id ${data._id}`;
            } else if (req.path.startsWith('/documentation-type')) {
              description = `tipo de documento eliminado con id ${data._id}`;
            } else if (req.path.startsWith('/workflow')) {
              description = `flujo de trabajo eliminado con id ${data._id}`;
            }
            // else if (req.path.startsWith('/step')) {
            //   description = `step eliminado con id ${data._id}`;
            // }
            else if (req.path.startsWith('/rol')) {
              description = `rol fue eliminado con id ${data._id}`;
            }
            // else if (req.path.startsWith('/permissions')) {
            //   description = `permiso eliminado con id ${data._id}`;
            // }
            else if (
              req.path.startsWith('/digital-signature/delete-digital-signature')
            ) {
              description = `firma digital eliminada de documento con id ${data._id}`;
            }
            // else if (req.path.startsWith('/roadmap')) {
            //   description = `hoja de ruta eliminado con id ${data._id}`;
            // }
            break;
          default:
            description = 'Accion predeterminada';
            break;
        }

        const date = new Date();
        const time = moment.utc(date).tz('America/La_Paz');
        const formattedDateTime = time.format('YYYY-MM-DD:HH:mm:ss');
        const bitacoraEntry = new this.botacoraModel({
          userId: req.user,
          userEmail: dataPersonal.email,
          action: `Metodo: ${req.method}`,
          description,
          path: `${req.headers['origin']}${req.url}`,
          timestamp: formattedDateTime,
        });
        await bitacoraEntry.save();
        console.log('esto es bitacoraentry del intereptor');
        console.log(data);

        return data;
      }),
    );
  }
}
