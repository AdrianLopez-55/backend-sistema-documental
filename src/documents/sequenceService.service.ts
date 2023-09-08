import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Documents, DocumentsSchema } from './schema/documents.schema';
import { Model } from 'mongoose';

@Injectable()
export class SequenceService {
  private currentYear: number = new Date().getFullYear();
  private documentCounter: number = 1;

  constructor(
    @InjectModel(Documents.name) private documentModel: Model<Documents>,
  ) {}

  async getNextValueNumberDocument(): Promise<string> {
    const currentYear = new Date().getFullYear().toString();
    const count = await this.documentModel.countDocuments({}).exec();
    const incrementValue = String(count + 1).padStart(3, '0');
    return `DOC-${incrementValue}-${currentYear}`;
  }

  async getNextValueNumberDocumentDD(): Promise<string> {
    const currentYear = new Date().getFullYear().toString();
    let year = await this.documentModel
      .findOne({ year: currentYear })
      .select('year')
      .exec();

    if (!year) {
      // Si no hay ningún documento registrado para el año actual, reinicia el contador.
      year.year = currentYear;
    }

    const count = await this.documentModel
      .countDocuments({ year: year })
      .exec();

    const incrementValue = String(count + 1).padStart(3, '0');
    return `DOC-${incrementValue}-${year}`;
  }
}
