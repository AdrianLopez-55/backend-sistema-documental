import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bitacora, BitacoraDocuments } from './schema/bitacora.schema';
import { Model } from 'mongoose';

@Injectable()
export class BitacoraService {
  constructor(
    @InjectModel(Bitacora.name) private bitacoraModel: Model<BitacoraDocuments>,
  ) {}
  async getAllBitacora() {
    return await this.bitacoraModel.find();
  }
}
