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
import { PaginationDto } from 'src/common/pagination.dto';

@Injectable()
export class DocumentationTypeService {
  private defaultLimit: number;
  private readonly apiFilesTemplate = getConfig().api_files_template;

  constructor(
    @InjectModel(DocumentationType.name)
    private readonly documentationTypeModel: Model<DocumentationTypeDocument>,
    private readonly customErrorService: CustomErrorService,
    private readonly httpService: HttpService,
  ) {}

  async create(
    createDocumentationTypeDto: CreateDocumentationTypeDto,
  ): Promise<DocumentationTypeDocument> {
    const { typeName, htmlContent, base64Docx } = createDocumentationTypeDto;
    // const typeNameUppercase = typeName.toUpperCase();
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

    //----DESDE AQUI SE CREA EL DOCX DEL TEMPLATE
    const HTMLtoDOCX = require('html-to-docx');
    if (htmlContent) {
      if (base64Docx) {
        throw new HttpException(
          'solo se puede enviar o html o .docx, no ambos',
          400,
        );
      }
      // const fileBuffer = await HTMLtoDOCX(
      //   htmlContent,
      //   null,
      //   {
      //     table: { row: { cansSplit: true } },
      //     footer: true,
      //     pageNumber: true,
      //   },
      // );
      const datatas = (async () => {
        const fileBuffer = await HTMLtoDOCX(htmlContent, {
          // table: { row: { cantSplit: true } },
          // footer: true,
          // pageNumber: true,
        });
        //guardar el archivo docx en template
        const templateDir = path.join(process.cwd(), 'template');
        const filePath = path.join(
          templateDir,
          `${typeName.toUpperCase()}.docx`,
        );
        fs.writeFileSync(filePath, fileBuffer);

        //obtener mime docx
        const fileExtension = path.extname(filePath).substring(1);
        const mimeTypeDocx = `@file/${fileExtension}`;
        // const mimeTypeDocx =
        //   '@file/vnd.openxmlformats-officedocument.wordprocessingml.document';

        //obtener la base64 de docx
        const arrayBufferView = new Uint8Array(fileBuffer);
        const base64 = Buffer.from(arrayBufferView).toString('base64');
        const docxBase64 = fileBuffer.toString('base64');

        fs.readFile(filePath, (err, data) => {
          if (err) {
            console.error('Error al leer el archivo:', err);
            return;
          }

          // Convierte los datos a base64
          const base64Data = data.toString('base64');

          // Ahora base64Data contiene el contenido del archivo .docx en base64
          console.log('Contenido del archivo en base64:', base64Data);
        });

        const fileObj = {
          mime: mimeTypeDocx,
          base64: docxBase64,
        };

        const fileDocx = await this.httpService
          .post(`${this.apiFilesTemplate}/files/upload-template`, {
            templateName: typeName,
            file: fileObj,
          })
          .toPromise();
        const timeToLiveFile = 1 * 60 * 1000;
        setTimeout(() => {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('error al eliminar el archivo temporal', err);
            } else {
              console.log('archivo temporal eliminado', filePath);
            }
          });
        }, timeToLiveFile);

        //crear el tipo de documento con su template
        const newTypeDocument = new this.documentationTypeModel({
          typeName,
          idTemplateDocType: fileDocx.data.file._id,
        });
        return await newTypeDocument.save();
      })();
      return datatas;
    } else {
      const prefixToCheck: string =
        'data:@file/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (base64Docx.startsWith(prefixToCheck)) {
        if (htmlContent) {
          throw new HttpException(
            'solo se puede subir o html o base64, no ambos al mismo tiempo',
            400,
          );
        }
      }
      const mimeType = base64Docx.split(';')[0].split(':')[1];
      const base64Data = base64Docx.split(',')[1];

      const fileObj = {
        mime: mimeType,
        base64: base64Data,
      };
      const fileDocx = await this.httpService
        .post(`${this.apiFilesTemplate}/files/upload-template`, {
          templateName: typeName,
          file: fileObj,
        })
        .toPromise();

      const newTypeDocument = new this.documentationTypeModel({
        typeName,
        idTemplateDocType: fileDocx.data.file._id,
      });
      return await newTypeDocument.save();
    }
  }

  async findAllPaginate(
    filter: DocumentationTypeFilter,
    dateRange: { startDate: Date; endDate: Date },
  ) {
    const {
      limit = this.defaultLimit,
      page = 1,
      activeDocumentType,
      idTemplateDocType,
      typeName,
    } = filter;

    let query = this.documentationTypeModel.find({ activeDocumentType: true });

    if (typeName) {
      query = query.where('typeName', new RegExp(typeName, 'i'));
    }

    if (idTemplateDocType) {
      query = query.where('idTemplateDocType');
    }

    if (activeDocumentType) {
      query = query.where('activeDocumentType');
    }

    if (dateRange.startDate && dateRange.endDate) {
      query = query.where('createdAt', {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      });
    }
    const offset = (page - 1) * limit;

    const filteredDocumentationType = await this.documentationTypeModel
      .find(query)
      .limit(limit)
      .skip(offset)
      .sort({ createdAt: -1 });
    const total = await this.documentationTypeModel
      .countDocuments(query)
      .exec();
    return {
      data: filteredDocumentationType,
      total: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDocumentsTypeActive(): Promise<DocumentationType[]> {
    const documentTypeActives = await this.documentationTypeModel
      .find({ activeDocumentType: true })
      .exec();
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
    return documentatioType;
  }

  async update(
    id: string,
    updateDocumentationTypeDto: UpdateDocumentationTypeDto,
  ) {
    const documentationType = await this.documentationTypeModel
      .findById(id)
      .exec();
    if (!documentationType) {
      throw new HttpException('no se encontro documento', 400);
    }

    if (documentationType.activeDocumentType === false) {
      throw new HttpException('documento borrado', 400);
    }
    const { typeName, htmlContent, base64Docx } = updateDocumentationTypeDto;

    const existingdocumentatuoType = await this.documentationTypeModel
      .findOne({ typeName })
      .exec();
    if (existingdocumentatuoType) {
      throw new HttpException('nombre repetido', 400);
    }

    //----DESDE AQUI SE CREA EL DOCX DEL TEMPLATE
    const HTMLtoDOCX = require('html-to-docx');
    if (htmlContent) {
      if (base64Docx) {
        throw new HttpException(
          'solo se puede enviar o html o .docx, no ambos',
          400,
        );
      }
      const fileBuffer = await HTMLtoDOCX(
        htmlContent,
        null,
        {
          table: { row: { cansSplit: true } },
          footer: true,
          pageNumber: true,
        },
        true,
      );

      //guardar el archivo docx en template
      const templateDir = path.join(process.cwd(), 'template');
      const filePath = path.join(templateDir, `${typeName.toUpperCase()}.docx`);
      fs.writeFileSync(filePath, fileBuffer);

      //obtener mime docx
      const fileExtension = path.extname(filePath).substring(1);
      const mimeTypeDocx = `application/${fileExtension}`;

      //obtener la base64 de docx
      const docxBase64 = fileBuffer.toString('base64');

      const fileObj = {
        mime: mimeTypeDocx,
        base64: docxBase64,
      };

      const fileDocx = await this.httpService
        .post(`${this.apiFilesTemplate}/files/upload-template`, {
          templateName: typeName,
          file: fileObj,
        })
        .toPromise();

      const timeToLiveFile = 1 * 60 * 1000;
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('error al eliminar el archivo temporal', err);
          } else {
            console.log('archivo temporal eliminado', filePath);
          }
        });
      }, timeToLiveFile);

      //sobreescribir datos de el tipo de documento con su template
      documentationType.typeName = typeName;
      documentationType.idTemplateDocType = fileDocx.data.file._id;
      return await documentationType.save();
    } else {
      const prefixToCheck: string =
        'data:@file/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (base64Docx.startsWith(prefixToCheck)) {
        if (htmlContent) {
          throw new HttpException(
            'solo se puede subir o html o base64, no ambos al mismo tiempo',
            400,
          );
        }
      }
      const mimeType = base64Docx.split(';')[0].split(':')[1];
      const base64Data = base64Docx.split(',')[1];

      const fileObj = {
        mime: mimeType,
        base64: base64Data,
      };
      const fileDocx = await this.httpService
        .post(`${this.apiFilesTemplate}/files/upload-template`, {
          templateName: typeName,
          file: fileObj,
        })
        .toPromise();

      documentationType.typeName = typeName;
      documentationType.idTemplateDocType = fileDocx.data.file._id;
      return await documentationType.save();
    }
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
      }
      return documentationType;
    } catch (error) {
      console.error('Error al buscar nombre tipo de doucmento', error);
      throw error;
    }
  }

  async getBase64Template(id: string) {
    const documentType = await this.documentationTypeModel.findById(id).exec();
    documentType.idTemplateDocType;
    const fileData = await this.httpService
      .get(
        `${getConfig().api_files_template}/file/template/${
          documentType.idTemplateDocType
        }`,
      )
      .toPromise();
    return {
      idTemplate: id,
      DocumentationTypeName: documentType.typeName,
      base64Docx: fileData.data.file.base64,
    };
  }
}
