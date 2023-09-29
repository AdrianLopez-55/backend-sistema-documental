import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DocumentationType,
  DocumentationTypeDocument,
} from 'src/documentation-type/schema/documentation-type.schema';

@Injectable()
export class FindDocumentationTypeService {
  constructor(
    @InjectModel(DocumentationType.name)
    private readonly documentationTypeModel: Model<DocumentationTypeDocument>,
  ) {}
  async findDocumentationType(
    documentTypeName: string,
  ): Promise<DocumentationType> {
    const documentationTypeData = await this.documentationTypeModel.findOne({
      typeName: documentTypeName,
    });
    if (!documentationTypeData) {
      throw new HttpException(
        `No se encontro nombre del tipo de documento ${documentTypeName}`,
        404,
      );
    }
    return documentationTypeData;
  }
}
