import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Documents, DocumentsSchema } from './schema/documents.schema';
import { Model } from 'mongoose';

@Injectable()
export class SequenceService {
  constructor(
    @InjectModel(Documents.name) private documentModel: Model<Documents>,
  ) {}

  async getNextValueNumberDocument(): Promise<string> {
    const count = await this.documentModel.countDocuments({}).exec();
    const incrementValue = String(count + 1).padStart(3, '0');
    return `DOC-${incrementValue}`;
  }
}
