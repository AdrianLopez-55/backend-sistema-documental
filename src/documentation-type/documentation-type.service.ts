import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { CreateDocumentationTypeDto } from './dto/create-documentation-type.dto';
import { UpdateDocumentationTypeDto } from './dto/update-documentation-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DocumentationType,
  DocumentationTypeDocument,
} from './schema/documentation-type.schema';
import { ErrorManager } from './error.interceptor';
import { Request } from 'express'
import { DocumentationTypeFilter } from './dto/documentType-filter.dto';

@Injectable()
export class DocumentationTypeService {
  constructor(
    @InjectModel(DocumentationType.name)
    private readonly documentationTypeModel: Model<DocumentationTypeDocument>,
  ) {}

  async create(createDocumentationTypeDto: CreateDocumentationTypeDto) {
    const { typeName } = createDocumentationTypeDto;
    const existingdocumentatuoType = await this.documentationTypeModel
      .findOne({ typeName })
      .exec();
    if (existingdocumentatuoType) {
      throw new HttpException('El titulo ya está en uso. No se permite la duplicación.', 400)
    }
    const newDocument = new this.documentationTypeModel(
      createDocumentationTypeDto,
    );
    return newDocument.save();
  }

  async findAll() {
    const findAllDocumetationType = await this.documentationTypeModel.find().exec();
    return findAllDocumetationType.sort((a,b) => a.typeName.localeCompare(b.typeName));
  }

  async findDocumentsTypeActive(): Promise<DocumentationType[]>{
    const documentTypeActives = await this.documentationTypeModel.find({ activeDocumentType: true }).exec();
    return documentTypeActives.sort((a,b) => a.typeName.localeCompare(b.typeName));
  }

  async findOne(id: string): Promise<DocumentationType> {
    const documentatioType = await this.documentationTypeModel
    .findOne({ _id: id })
    .exec();

    if(!documentatioType){
      throw new ErrorManager({
        type: 'NOT_FOUND',
        message: 'Tipo de documentacion no encontrado'
      })
    }
    return documentatioType;
  }

  async update(
    id: string,
    updateDocumentationTypeDto: UpdateDocumentationTypeDto,
  ) {
    return this.documentationTypeModel.findByIdAndUpdate(
      { _id: id },
      updateDocumentationTypeDto,
      { new: true },
    );
  }

  async inactiverTypeDocument(id: string, activeDocumentType: boolean) {
    const typeDocument: DocumentationTypeDocument =
      await this.documentationTypeModel.findById(id);
    typeDocument.activeDocumentType = false;
    await typeDocument.save();
    return typeDocument;
  }

  async activerTypeDocument(id: string, activeDocumentType: boolean) {
    const typeDocument: DocumentationTypeDocument =
      await this.documentationTypeModel.findById(id);
    typeDocument.activeDocumentType = true;
    await typeDocument.save();
    return typeDocument;
  }

  async getDocumentatioTypeByName(
    typeName: string,
  ): Promise<DocumentationType> {
    try {
      const documentationType = this.documentationTypeModel
      .findOne({ typeName })
      .exec();
    return documentationType;
    } catch (error) {
      console.error('Error al buscar nombre tipo de doucmento', error);
      throw error; 
    }
  }

  async filterParams(filter: DocumentationTypeFilter): Promise<DocumentationType[]>{
    const query = {};

    if(filter.typeName){
      query['typeName'] = { $regex: filter.typeName, $options: 'i' }
    }

    const filteredDocumetationType = await this.documentationTypeModel.find(query).exec();
    return filteredDocumetationType
	}
  
}
