import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { SequenceDocument, SequenceModel } from './schema/sequence.schema';

@Injectable()
export class SequenceService {
  private currentYear: string = new Date().getFullYear().toString();
  private lastYear: string = this.currentYear;
  private count: number = 0;
  constructor(
    @InjectModel(SequenceModel.name)
    private sequenceModel: Model<SequenceDocument>,
    @InjectModel(Documents.name) private documentModel: Model<Documents>,
  ) {}

  async getNextValueNumberDocument(): Promise<string> {
    const currentYear = new Date().getFullYear().toString();
    const key = 'numberDocument';
    let sequence = await this.sequenceModel.findOne({ key });

    if (!sequence) {
      sequence = new this.sequenceModel({ key, year: currentYear, count: 1 });
    } else if (sequence.year !== currentYear) {
      sequence.year = currentYear;
      sequence.count = 1;
    } else {
      sequence.count++;
    }
    await sequence.save();
    const incrementalValue = String(sequence.count).padStart(7, '0');
    return `DOC-${incrementalValue}-${currentYear}`;
  }
}
