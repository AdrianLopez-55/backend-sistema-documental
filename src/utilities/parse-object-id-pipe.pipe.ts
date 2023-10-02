import { PipeTransform, Injectable, HttpException } from '@nestjs/common';
import mongoose from 'mongoose';

@Injectable()
export class ParseObjectIdPipe
  implements PipeTransform<any, mongoose.Types.ObjectId>
{
  transform(value: any): mongoose.Types.ObjectId {
    try {
      const validObjectId: boolean = mongoose.isObjectIdOrHexString(value);
      if (!validObjectId) {
        throw new HttpException(`Objeto ID: ${value} no válido`, 400);
      }
      return value;
    } catch (error) {
      throw new HttpException(`Ocurrio un error: ${error}`, 500);
    }
  }
}
