import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateDocumentationTypeDto } from './dto/create-documentation-type.dto';
import { UpdateDocumentationTypeDto } from './dto/update-documentation-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DocumentationType,
  DocumentationTypeDocument,
} from './schema/documentation-type.schema';
import { ErrorManager } from './error.interceptor';
import { Request } from 'express';
import { DocumentationTypeFilter } from './dto/documentType-filter.dto';
import { CustomErrorService } from 'src/error.service';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import getConfig from '../config/configuration';
import * as fs from 'fs';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import * as officegen from 'officegen';
import * as pdfkit from 'pdfkit';

@Injectable()
export class DocumentationTypeService {
  constructor(
    @InjectModel(DocumentationType.name)
    private readonly documentationTypeModel: Model<DocumentationTypeDocument>,
    private readonly customErrorService: CustomErrorService,
    private readonly httpService: HttpService,
  ) {}

  async create(
    createDocumentationTypeDto: CreateDocumentationTypeDto,
  ): Promise<DocumentationTypeDocument> {
    const { typeName } = createDocumentationTypeDto;
    const typeNameUppercase = typeName.toUpperCase();
    const existingdocumentatuoType = await this.documentationTypeModel
      .findOne({ typeName })
      .exec();
    if (existingdocumentatuoType) {
      this.customErrorService.customResponse(
        HttpStatus.BAD_REQUEST,
        true,
        'ya existe dato',
        'El nombre de tipo de documentacion ya existe.',
      );
    }

    //---------------------template -------
    const fileName = `${typeNameUppercase}_template.docx`;
    const documentData = {
      documentationTypeTag: `${typeNameUppercase}`,
      numberDocumentTag: '{numberDocumentTag}',
      title: '{title}',
      descriptionTag: '{descriptionTag}',
      createdAtTag: '{createdAt}',
    };

    const titleParagraph = new Paragraph({
      text: documentData.documentationTypeTag,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
    });
    const separatorLineParagraph = new Paragraph({
      text: '---------------------------------------------',
    });
    const numberDocumentParagraph = new Paragraph({
      text: `Número de Documento: ${documentData.numberDocumentTag}`,
    });
    const referenceTitleParagraph = new Paragraph({
      text: `Asunto: ${documentData.title}`,
    });
    const dateTitleParagraph = new Paragraph({
      text: `Fecha: ${documentData.createdAtTag}`,
    });
    const titleContenidoParagraph = new Paragraph({
      text: 'Contenido:',
    });
    const descriptionParagraph = new Paragraph({
      text: `${documentData.descriptionTag}`,
    });

    const doc = new Document({
      sections: [
        {
          children: [
            titleParagraph,
            separatorLineParagraph,
            numberDocumentParagraph,
            referenceTitleParagraph,
            dateTitleParagraph,
            titleContenidoParagraph,
            descriptionParagraph,
          ],
        },
      ],
    });

    const templateDirectory = path.join(process.cwd(), 'template');
    if (!fs.existsSync(templateDirectory)) {
      fs.mkdirSync(templateDirectory);
    }
    const filePath = path.join(templateDirectory, fileName);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    const dataUri = await this.fileToDataUri(filePath, fileName);
    if (!fileName) {
      throw new HttpException('no hay nombre', 400);
    }
    if (!dataUri) {
      throw new HttpException('no hay id de archivo', 400);
    }

    const timeToLive = 1 * 60 * 1000;
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log('error al borar archivo', err);
        } else {
          console.log('archivo temporal eliminado', filePath);
        }
      });
    }, timeToLive);

    const newDocument = new this.documentationTypeModel({
      typeName,
      idTemplateDocType: dataUri._idFile,
    });

    return await newDocument.save();
  }

  async findAll() {
    const findAllDocumetationType = await this.documentationTypeModel
      .find()
      .exec();
    for (const doc of findAllDocumetationType) {
      if (doc.idTemplateDocType) {
        const obtainBase64Template = await this.httpService
          .get(
            `${getConfig().api_files_uploader}/file/${doc.idTemplateDocType}`,
          )
          .toPromise();
        const dataTemplate =
          'data:' +
          obtainBase64Template.data.file.mime +
          ';base64,' +
          obtainBase64Template.data.file.base64;
        doc.dataUriTemplate = dataTemplate;
      }
    }
    return findAllDocumetationType.sort((a, b) =>
      a.typeName.localeCompare(b.typeName),
    );
  }

  async findDocumentsTypeActive(): Promise<DocumentationType[]> {
    const documentTypeActives = await this.documentationTypeModel
      .find({ activeDocumentType: true })
      .exec();

    for (const doc of documentTypeActives) {
      if (doc.idTemplateDocType) {
        const obtainBase64Template = await this.httpService
          .get(
            `${getConfig().api_files_uploader}/file/${doc.idTemplateDocType}`,
          )
          .toPromise();
        const dataTemplate =
          'data:' +
          obtainBase64Template.data.file.mime +
          ';base64,' +
          obtainBase64Template.data.file.base64;
        doc.dataUriTemplate = dataTemplate;
      }
    }
    return documentTypeActives.sort((a, b) =>
      a.typeName.localeCompare(b.typeName),
    );
  }

  async findOne(id: string): Promise<DocumentationType> {
    const documentatioType = await this.documentationTypeModel
      .findOne({ _id: id })
      .exec();

    if (!documentatioType) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'No encontrado',
        'No se encontro el tipo de documentacion',
      );
    }
    if (documentatioType.activeDocumentType === false) {
      throw new HttpException('tipo de documento borrado', 400);
    }
    if (documentatioType.idTemplateDocType) {
      const obtainBase64Template = await this.httpService
        .get(
          `${getConfig().api_files_uploader}/file/${
            documentatioType.idTemplateDocType
          }`,
        )
        .toPromise();
      const dataTemplate =
        'data:' +
        obtainBase64Template.data.file.mime +
        ';base64,' +
        obtainBase64Template.data.file.base64;
      documentatioType.dataUriTemplate = dataTemplate;
    }
    return documentatioType;
  }

  async update(
    id: string,
    updateDocumentationTypeDto: UpdateDocumentationTypeDto,
  ) {
    const documentationType = await this.documentationTypeModel.findById(id);
    if (!documentationType) {
      throw new HttpException('no se encontro documento', 400);
    }

    if (documentationType.activeDocumentType === false) {
      throw new HttpException('documento borrado', 400);
    }
    const { typeName } = updateDocumentationTypeDto;

    const existingdocumentatuoType = await this.documentationTypeModel
      .findOne({ typeName })
      .exec();
    if (existingdocumentatuoType) {
      throw new HttpException('nombre repetido', 400);
    }

    if (typeName) {
      const fileName = `${typeName}.docx`;
      const documentData = {
        documentationTypeTag: `${typeName}`,
        numberDocumentTag: '{numberDocumentTag}',
        title: '{title}',
        descriptionTag: '{descriptionTag}',
        createdAtTag: '{createdAt}',
      };

      const titleParagraph = new Paragraph({
        text: documentData.documentationTypeTag,
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
      });

      const separatorLineParagraph = new Paragraph({
        text: '---------------------------------------------',
      });

      const numberDocumentParagraph = new Paragraph({
        text: `Número de Documento: ${documentData.numberDocumentTag}`,
      });

      const referenceTitleParagraph = new Paragraph({
        text: `Asunto: ${documentData.title}`,
      });

      const dateTitleParagraph = new Paragraph({
        text: `Fecha: ${documentData.createdAtTag}`,
      });

      const titleContenidoParagraph = new Paragraph({
        text: 'Contenido:',
      });

      const descriptionParagraph = new Paragraph({
        text: `${documentData.descriptionTag}`,
      });

      const doc = new Document({
        sections: [
          {
            children: [
              titleParagraph,
              separatorLineParagraph,
              numberDocumentParagraph,
              referenceTitleParagraph,
              dateTitleParagraph,
              titleContenidoParagraph,
              descriptionParagraph,
            ],
          },
        ],
      });

      const templateDirectory = path.join(process.cwd(), 'template');
      if (!fs.existsSync(templateDirectory)) {
        fs.mkdirSync(templateDirectory);
      }
      const filePath = path.join(templateDirectory, fileName);
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);

      const timeToLive = 1 * 60 * 1000;
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.log('error al borar archivo', err);
          } else {
            console.log('archivo temporal eliminado', filePath);
          }
        });
      }, timeToLive);

      const dataUri = await this.fileToDataUri(filePath, fileName);
      if (!fileName) {
        throw new HttpException('no hay nombre', 400);
      }
      if (!dataUri) {
        throw new HttpException('no hay id de archivo', 400);
      }

      documentationType.typeName = typeName;
      documentationType.idTemplateDocType = dataUri._idFile;
    }

    await documentationType.save();
    return documentationType;
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
      const documentationType = await this.documentationTypeModel
        .findOne({ typeName })
        .exec();
      if (!documentationType) {
        throw new HttpException(
          'no se encontro nombre de tipo de documento',
          400,
        );
      }
      if (documentationType.activeDocumentType === false) {
        throw new HttpException('tipo de documento eliminado', 400);
      }

      if (documentationType.idTemplateDocType) {
        const obtainBase64Template = await this.httpService
          .get(
            `${getConfig().api_files_uploader}/file/${
              documentationType.idTemplateDocType
            }`,
          )
          .toPromise();
        const dataTemplate =
          'data:' +
          obtainBase64Template.data.file.mime +
          ';base64,' +
          obtainBase64Template.data.file.base64;
        documentationType.dataUriTemplate = dataTemplate;
      }
      return documentationType;
    } catch (error) {
      console.error('Error al buscar nombre tipo de doucmento', error);
      throw error;
    }
  }

  async filterParams(
    filter: DocumentationTypeFilter,
  ): Promise<DocumentationType[]> {
    const query = {};

    if (filter.typeName) {
      query['typeName'] = { $regex: filter.typeName, $options: 'i' };
    }

    const filteredDocumetationType = await this.documentationTypeModel
      .find(query)
      .exec();

    for (const doc of filteredDocumetationType) {
      if (doc.idTemplateDocType) {
        const obtainBase64Template = await this.httpService
          .get(
            `${getConfig().api_files_uploader}/file/${doc.idTemplateDocType}`,
          )
          .toPromise();
        const dataTemplate =
          'data:' +
          obtainBase64Template.data.file.mime +
          ';base64,' +
          obtainBase64Template.data.file.base64;
        doc.dataUriTemplate = dataTemplate;
      }
    }
    return filteredDocumetationType;
  }

  async fileToDataUri(filePath: string, typeName: string) {
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    const fileExtension = path.extname(filePath).substring(1);
    const mimeType = `application/${fileExtension}`;

    const fileObj = {
      mime: mimeType,
      base64: base64Data,
    };

    const response = await this.httpService
      .post(`${getConfig().api_files_template}/files/upload-template-docx`, {
        templateName: typeName,
        file: fileObj,
      })
      .toPromise();
    const { _id } = response.data.file;
    const fileRegister = {
      _idFile: _id,
    };
    return fileRegister;
  }
}
