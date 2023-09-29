import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Documents, DocumentsSchema } from './schema/documents.schema';
import { Model } from 'mongoose';

@Injectable()
export class SequenceService {
  private globalCounter: number = 0;
  private contadorLock: boolean = false;

  constructor(
    @InjectModel(Documents.name) private documentModel: Model<Documents>,
  ) {}

  // async getNextValueNumberDocument(): Promise<string> {
  //   let currentYear = new Date().getFullYear().toString();
  //   let year = await this.documentModel.findOne({ year: currentYear }).exec();
  //   const yearNow = new Date().getFullYear().toString();
  //   if (yearNow !== currentYear) {
  //     currentYear = yearNow; // Actualiza el año almacenado
  //     this.globalCounter = 1; // Reinicia el contador a 1
  //   }
  //   this.globalCounter += 1;
  //   const count = await this.documentModel.countDocuments({}).exec();
  //   const incrementValue = String(this.globalCounter).padStart(7, '0');
  //   return `DOC-${incrementValue}-${currentYear}`;
  // }

  async getNextValueNumberDocument(): Promise<string> {
    const currentYear = new Date().getFullYear().toString();
    let count = await this.documentModel.countDocuments({}).exec();
    const incrementValue = String(count + 1).padStart(7, '0');
    return `DOC-${incrementValue}-${currentYear}`;
  }

  // async getNextValueNumberDocument(): Promise<string> {
  //   if (!this.contadorLock) {
  //     this.contadorLock = true;

  //     try {
  //       const currentYear = new Date().getFullYear().toString();
  //       let count = await this.documentModel.countDocuments({}).exec();
  //       const incrementValue = String(count + 1).padStart(7, '0');

  //       // Crear el nuevo documento con el número de documento generado
  //       await this.documentModel.create({
  //         numberDocument: `DOC-${incrementValue}-${currentYear}`,
  //         // Otros campos del documento
  //       });

  //       return `DOC-${incrementValue}-${currentYear}`;
  //     } finally {
  //       this.contadorLock = false;
  //     }
  //   } else {
  //     // Esperar un breve período y luego intentar nuevamente (puedes ajustar el tiempo según tus necesidades)
  //     await new Promise((resolve) => setTimeout(resolve, 100));
  //     return this.getNextValueNumberDocument();
  //   }
  // }
}
