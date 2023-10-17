import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Documents, DocumentsSchema } from './schema/documents.schema';
import { Model } from 'mongoose';

@Injectable()
export class SequenceService {
  private currentYear: string = new Date().getFullYear().toString();
  private lastYear: string = this.currentYear;
  private count: number = 0;
  constructor(
    @InjectModel(Documents.name) private documentModel: Model<Documents>,
  ) {}

  async getNextValueNumberDocument(): Promise<string> {
    const year = new Date().getFullYear().toString();
    if (year !== this.currentYear) {
      this.lastYear = this.currentYear;
      this.currentYear = year;
      this.count = 1;
    } else {
      this.count++;
    }
    // const currentYear = new Date().getFullYear().toString();
    // let count = await this.documentModel.countDocuments({}).exec();
    // const incrementValue = String(count + 1).padStart(7, '0');
    const incrementalValue = String(this.count).padStart(7, '0');
    // return `DOC-${incrementValue}-${currentYear}`;
    return `DOC-${incrementalValue}-${year}`;

    /*
      async getNextValueNumberDocument(): Promise<string> {
    const year = new Date().getFullYear().toString();
    
    if (year !== this.currentYear) {
      this.currentYear = year;
      this.setStoredYear(year); // Almacena el nuevo año en la base de datos.
      // Reiniciar el contador para el nuevo año.
      const count = 1;
      const incrementValue = String(count).padStart(7, '0');
      return `DOC-${incrementValue}-${year}`;
    } else {
      // Continuar incrementando el contador.
      let count = await this.documentModel.countDocuments({}).exec();
      count++;
      this.setStoredCount(count); // Almacena el nuevo contador en la base de datos.
      const incrementValue = String(count).padStart(7, '0');
      return `DOC-${incrementValue}-${year}`;
    }
  }

  // Implementa las funciones para almacenar/recuperar el año en la base de datos.
  private getStoredYear(): string {
    // Implementa la lógica para recuperar el año almacenado en la base de datos.
  }

  private setStoredYear(year: string): void {
    // Implementa la lógica para almacenar el año en la base de datos.
  }

  private setStoredCount(count: number): void {
    // Implementa la lógica para almacenar el contador en la base de datos.
  }
  */
  }
}
