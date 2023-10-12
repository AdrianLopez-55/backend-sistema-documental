import {
  HttpException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateDocumentDTO } from './dto/updateDocument.dto';
import { CreateDocumentDTO } from './dto/createDocument.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
// import { Request } from 'express';
import { PaginationDto } from '../common/pagination.dto';
import { HttpService } from '@nestjs/axios';
import { DocumentationTypeService } from 'src/documentation-type/documentation-type.service';
import { DocumentationType } from 'src/documentation-type/schema/documentation-type.schema';
import getConfig from '../config/configuration';
import {
  Workflow,
  WorkflowDocuments,
} from 'src/workflow/schemas/workflow.schema';
// import * as PDFDocument from 'pdfkit';
import { DocumentsFilter } from './dto/documents-filter.dto';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { map } from 'rxjs/operators';
import * as fs from 'fs';
import { TemplateHandler } from 'easy-template-x';
import { CustomErrorService } from 'src/error.service';
import { AddWorkflowDocumentDto } from './dto/addWorkflowDocument.dto';
import { AddWorkflowSinCiDocumentDto } from './dto/addWorkflowSinCiDocument.dto';
import * as docxConverter from 'docx-pdf';
import { FindDocumentationTypeService } from './findDocumentationType.service';
import mongoose from 'mongoose';
// import { Milestone } from './schema/milestone.schema';
// import { StateDocumentSchema } from 'src/state-document/schemas/state-document.schema';
import puppeteer from 'puppeteer';
import { SendDerivedDocumentsService } from './sendDerivedDocuments.service';
import { GetDocumentsService } from './getsDocuments.service';
import { SendHtmlFileDto } from './dto/sendHtmlFile.dto';
import { Template } from 'src/template/schemas/template.schema';

@Injectable()
export class DocumentsService {
  private defaultLimit: number;
  private readonly apiFilesUploader = getConfig().api_files_uploader;
  private readonly apiFilesTemplate = getConfig().api_files_template;
  private readonly apiPersonalGet = getConfig().api_personal_get;
  private readonly apiTemplate = getConfig().api_template;

  constructor(
    @InjectModel(Documents.name)
    private readonly documentModel: Model<DocumentDocument>,
    private readonly httpService: HttpService,
    @InjectModel(DocumentationType.name)
    @InjectModel(Workflow.name)
    private workflowModel: Model<WorkflowDocuments>,
    // private readonly customErrorService: CustomErrorService, // private personalGetService: PersonalGetService,
    private readonly findDocumentationTypeService: FindDocumentationTypeService,
    private sendDerivedDocumentsService: SendDerivedDocumentsService,
    private getDocumentsService: GetDocumentsService,
  ) {}

  async createMultiDocuments(userId: string) {
    async function connectToDataBase() {
      const dbUrl = 'mongodb://localhost/documental';
      try {
        await mongoose.connect(dbUrl);
        console.log('conectado a la base de datos');
      } catch (error) {
        console.log('Error al conectar a la base de datos:', error);
        process.exit(1);
      }
    }

    await connectToDataBase();
    const numberOfDocumentsToGenerate = 10000;
    const DocumentsSchema = new mongoose.Schema({
      numberDocument: String,
      userId: String,
      title: String,
      documentationType: Object,
      stateDocumentUserSend: String,
      workflow: Object,
      description: String,
      fileRegister: mongoose.Schema.Types.Mixed,
      active: Boolean,
      year: String,
      state: String,
    });

    const documentModel = mongoose.model<DocumentDocument>(
      'Document',
      DocumentsSchema,
    );
    const documentsToCreate: Partial<DocumentDocument>[] = [];
    for (let i = 0; i < numberOfDocumentsToGenerate; i++) {
      const newDocument: Partial<DocumentDocument> = {
        numberDocument: `DOC-0000${i + 1}-2023`,
        userId: userId,
        title: `titulo-${i + 1}`,
        // documentationType: {
        //   typeName: 'LICENCIA',
        //   idTemplateDocType: `64f74c3d215abf8c9be98306`,
        //   activeDocumentType: true,
        //   createdAt: new Date(),
        //   updateAt: new Date(),
        //   dataUriTemplate: '',
        // },
        documentationType: {
          typeName: 'LICENCIA',
          idTemplateDocType: `description-${i + 1}`,
          activeDocumentType: true,
          dataUriTemplate: '',
          createdAt: undefined,
          updateAt: undefined,
        },
        stateDocumentUserSend: `EN ESPERA`,
        workflow: {
          nombre: 'WORKFLOW A',
          descriptionWorkflow: 'STRING',
          pasos: [
            {
              paso: 1,
              idOffice: '65084336717fc4c1b23d1452',
              oficina: 'RECTORADO',
              completado: true,
            },
            {
              paso: 2,
              idOffice: '65084467717fc4c1b23d1468',
              oficina: 'VICERECTORADO',
              completado: false,
            },
          ],
          idStep: '65240c3d7ba0128f73a8749f',
          oficinaActual: 'RECTORADO',
          updateAt: new Date(),
          activeWorkflow: true,
          pasoActual: 1,
          createdAt: undefined,
        },
        active: true,
        year: `2023`,
        state: `create`,
        userReceivedDocument: [
          {
            ciUser: '8845784',
            idOfUser: '64e7c787eec126d6cb54296e',
            nameOfficeUserRecieved: 'RECTORADO',
            dateRecived: new Date(),
            stateDocumentUser: 'RECIBIDO',
            observado: false,
          },
        ],
        description: `description-${i + 1}`,
        fileRegister: null,
      };

      documentsToCreate.push(newDocument);
    }
    try {
      for (const documentData of documentsToCreate) {
        const newDocument = new documentModel(documentData);
        await newDocument.save();
      }
    } catch (error) {
      console.error('Error al crear registros de libros:', error);
    } finally {
      mongoose.connection.close();
    }
  }

  //-------------------------------

  async htmlConvertPdf(sendHtmlFileDto: SendHtmlFileDto) {
    const { htmlContent, nameFile, descriptionFile } = sendHtmlFileDto;
    const browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      // format: pageSize,
      // printBackground: true,
    });

    await browser.close();

    const pdfBase64 = pdfBuffer.toString('base64');

    return {
      nameFile: nameFile,
      descriptionFile: descriptionFile,
      pdfBase64: pdfBase64,
    };
  }
  //-------------------------------

  async create(createDocumentDTO: CreateDocumentDTO, userId: string) {
    try {
      const { file, documentTypeName } = createDocumentDTO;
      const documentationTypeData =
        await this.findDocumentationTypeService.findDocumentationType(
          documentTypeName,
        );

      // const documentationTypeData = await this.httpService
      //   .get(`${this.apiTemplate}/filtered?nameTemplate=${documentTypeName}`)
      //   .toPromise();
      // console.log('esto es el template encontrado simple');
      // console.log(documentationTypeData.data[0]);

      if (file) {
        const { mime, base64 } = this.extractFileData(file);
        const fileObj = {
          mime: mime,
          base64: base64,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
        const newDocument = new this.documentModel({
          ...createDocumentDTO,
          fileRegister,
          documentationType: documentationTypeData,
          stateDocumentUserSend: 'EN ESPERA',
          userId: userId,
        });
        return newDocument.save();
      } else {
        return this.functionCreateDocument(
          createDocumentDTO,
          documentationTypeData,
          userId,
        );
      }
    } catch (error) {
      throw new Error(`error encontrado: ${error}`);
    }
  }

  async getBase64Documents(id: string) {
    const document = await this.checkDocument(id);
    if (document.fileRegister && typeof document.fileRegister === 'object') {
      const fileRegisterObject = document.fileRegister as unknown as {
        idFile: string;
      };
      try {
        const res = await this.httpService
          .get(`${this.apiFilesUploader}/file/${fileRegisterObject.idFile}`)
          .toPromise();
        document.fileBase64 = res.data.file.base64;
      } catch (error) {
        document.fileBase64 = null;
      }
      const idDocument = id;
      const fileBase64 = document.fileBase64;
      const showDocument = { idDocument, fileBase64 };
      return showDocument;
    } else {
      throw new HttpException(
        'El documento no cuenta con un archivo adjunto',
        400,
      );
    }
  }

  async showBase64TemplateDoc(id: string) {
    const document = await this.checkDocument(id);
    const idTemplateFromDoc = document.documentationType.idTemplateDocType;
    const getBase64Template = await this.httpService
      .get(`${this.apiFilesUploader}/file/template/${idTemplateFromDoc}`)
      .toPromise();
    const base64TemplateDoc = getBase64Template.data.file.base64;

    //--decodificar base64 a dats binarios
    const binaryData = Buffer.from(base64TemplateDoc, 'base64');

    //--especificar ruta y nombre del archivo temporal
    const path = require('path');
    const tempFolder = path.join(process.cwd(), 'template');
    const fileName = `${document.documentationType.typeName}_template.docx`;
    const filePathTemplateDoc = path.join(tempFolder, fileName);
    fs.writeFileSync(filePathTemplateDoc, binaryData);

    //---borrar el template descargado
    const timeToLiveInMIllisecondsTemplate = 1 * 60 * 1000;
    setTimeout(() => {
      fs.unlink(filePathTemplateDoc, (err) => {
        if (err) {
          console.error('error al eliminar archivo temporal: ', err);
        } else {
          console.log('Archivo temporal eliminado: ', filePathTemplateDoc);
        }
      });
    }, timeToLiveInMIllisecondsTemplate);

    const rutaTemplate = path.join(
      process.cwd(),
      'template',
      `${document.documentationType.typeName}_template.docx`,
    );
    const templatefile = fs.readFileSync(rutaTemplate);
    const data = {
      nameTemplate: document.documentationType.typeName,
      numberDocumentTag: document.numberDocument,
      title: document.title,
      descriptionTag: document.description,
    };
    const handler = new TemplateHandler();
    const doc = await handler.process(templatefile, data);
    const fileNameDoc = `${document.documentationType.typeName}_${document.numberDocument}.docx`;
    const fileNamePdf = `${document.documentationType.typeName}_${document.numberDocument}.pdf`;
    const templateDirectorySave = path.join(process.cwd(), 'template');
    const filePathDoc = path.join(templateDirectorySave, fileNameDoc);
    fs.writeFileSync(filePathDoc, doc);
    //------------ convert to pdf ===============
    // const imputDocumentTemplate = fs.readFileSync(lugarDocument);
    const inputPath = path.join(
      process.cwd(),
      'template',
      `${document.documentationType.typeName}_${document.numberDocument}.docx`,
    );
    const outPutDocumentTemplate = path.join(process.cwd(), 'template');
    const outPUthFileName = `${document.documentationType.typeName}_${document.numberDocument}.pdf`;
    const outputhPathTemplate = path.join(
      outPutDocumentTemplate,
      outPUthFileName,
    );
    await this.convertDocxToPdf(inputPath, outputhPathTemplate);
    const rutaPdfGenerated = path.join(
      process.cwd(),
      'template',
      `${document.documentationType.typeName}_${document.numberDocument}.pdf`,
    );
    const resultFile = fs.readFileSync(rutaPdfGenerated);
    const base64String = resultFile.toString('base64');
    const fileExtension = path
      .extname(
        `${document.documentationType.typeName}_${document.numberDocument}.pdf`,
      )
      .substring(1);
    const mimeTypePdf = `application/${fileExtension}`;
    const dataPdf = {
      mime: mimeTypePdf,
      base64: base64String,
    };
    const sentDataDocx = await this.httpService
      .post(`${this.apiFilesTemplate}/files/upload-template`, {
        templateName: fileNamePdf,
        file: dataPdf,
      })
      .toPromise();

    const timeToLiveInMIlliseconds = 30 * 1000;

    setTimeout(() => {
      fs.unlink(filePathDoc, (err) => {
        if (err) {
          console.error('error al eliminar archivo temporal: ', err);
        } else {
          console.log('Archivo temporal eliminado: ', filePathDoc);
        }
      });

      fs.unlink(outputhPathTemplate, (err) => {
        if (err) {
          console.error('Error al eliminar archivo temporal PDF: ', err);
        } else {
          console.log('Archivo temporal PDF eliminado: ', outputhPathTemplate);
        }
      });
    }, timeToLiveInMIlliseconds);
    document.idTemplate = sentDataDocx.data.file._id;
    if (document.idTemplate) {
      try {
        const res = await this.httpService
          .get(`${this.apiFilesUploader}/file/${document.idTemplate}`)
          .toPromise();
        document.base64Template = res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro datos', 404);
      }
    }
    const idDocument = id;
    const idTemplate = document.idTemplate;
    const base64Template = document.base64Template;
    let showDocument = { idDocument, idTemplate, base64Template };
    return showDocument;
  }

  async update(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
    userId: string,
  ) {
    const { documentTypeName, file } = updateDocumentDTO;
    const documentationType =
      await this.findDocumentationTypeService.findDocumentationType(
        documentTypeName,
      );
    if (file && file.startsWith('data')) {
      const { mime, base64 } = this.extractFileData(file);
      const fileObj = {
        mime,
        base64,
      };
      const response = await this.uploadFile(fileObj);
      const fileRegister = this.createFileRegister(response.data.file);
      const updateDocument = {
        ...updateDocumentDTO,
        fileRegister,
        documentationType,
      };
      const updateNewDocument = await this.documentModel
        .findOneAndUpdate({ _id: id }, updateDocument, { new: true })
        .exec();
      return updateNewDocument;
    } else {
      const updateDocument = {
        ...updateDocumentDTO,
        documentationType,
      };
      const updateNewDocument = await this.documentModel
        .findOneAndUpdate({ _id: id }, updateDocument, { new: true })
        .exec();
      return updateNewDocument;
    }
  }

  async enviarDocument(
    documentId: string,
    addWorkflowDocumentDto: AddWorkflowDocumentDto,
    userId: string,
  ): Promise<Documents> {
    return await this.sendDerivedDocumentsService.sendDocumentWithCi(
      documentId,
      addWorkflowDocumentDto,
      userId,
    );
  }

  async sendDocumentToUnity(
    documentId: string,
    addWorkflowSinCiDocumentDto: AddWorkflowSinCiDocumentDto,
    userId: string,
  ): Promise<Documents> {
    return await this.sendDerivedDocumentsService.sendDocumentToUnity(
      documentId,
      addWorkflowSinCiDocumentDto,
      userId,
    );
  }

  async derivarDocumentAll(
    documentId: string,
    userId: string,
  ): Promise<Documents> {
    return await this.sendDerivedDocumentsService.derivarDocumentAll(
      documentId,
      userId,
    );
  }

  async derivarDocumentWithCi(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    return await this.sendDerivedDocumentsService.derivarDocumentWithCi(
      documentId,
      ci,
      userId,
    );
  }

  async sendDocumentSinWorkflow(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    return await this.sendDerivedDocumentsService.sendDocumentSinWorkflow(
      documentId,
      ci,
      userId,
    );
  }

  async sendDocumentMultiUnitysWithoutWorkflow(
    documentId: string,
    unitys: string[],
    userId: string,
  ) {
    return await this.sendDerivedDocumentsService.sendDocumentMultiUnitysWithoutWorkflow(
      documentId,
      unitys,
      userId,
    );
  }

  async getRecievedDocumentsMultiUnitys(userId: string) {
    return await this.getDocumentsService.getRecievedDocumentsMultiUnitys(
      userId,
    );
  }

  async markDocumentReviewed(id: string, userId: string): Promise<Documents> {
    const document = await this.checkDocument(id);

    const userMarkReviewed = document.userReceivedDocument.find((entry) => {
      return entry.idOfUser === userId;
    });

    const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
      return entry.receivedUsers.some((user) => user.idOfUser === userId);
    });

    if (!bitacoraEntry) {
      throw new HttpException(
        `Usuario con ID: ${userId} no tiene permiso para marcar como revisado este documento`,
        403,
      );
    }

    // Verificar si el usuario ya revisó el documento
    const userAlreadyReviewed = bitacoraEntry.receivedUsers.some((user) => {
      return user.idOfUser === userId && user.stateDocumentUser === 'REVISADO';
    });

    if (userMarkReviewed.stateDocumentUser === 'REVISADO') {
      throw new HttpException(`El documento ya fue recibado por usted`, 400);
    }

    if (userAlreadyReviewed) {
      throw new HttpException('El documento ya fue revisado por usted', 400);
    }

    const pasos = document.workflow.pasos;
    const currentStepIndex = document.workflow.pasoActual - 1;
    if (
      currentStepIndex < pasos.length - 1 &&
      !pasos[currentStepIndex + 1].completado
    ) {
      const updateBitacoraEntry = {
        ...bitacoraEntry,
        receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
          if (user.idOfUser === userId) {
            user.stateDocumentUser = 'REVISADO';
          }
          return user;
        }),
      };
      const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
        return entry === bitacoraEntry ? updateBitacoraEntry : entry;
      });

      userMarkReviewed.stateDocumentUser = 'REVISADO';
      document.bitacoraWorkflow = updateBitacoraWorkflow;
      document.stateDocumetUser = 'REVISADO';

      await document.save();
      return document;
    } else {
      throw new HttpException(
        'No se puede marcar como revisado en este momento. El siguiente paso ya está completado o no existe.',
        403,
      );
    }
  }

  async getDocumentsReviewed(userId: string) {
    return await this.getDocumentsService.getDocumentReviewed(userId);
  }

  async markDocumentcompleted(id: string, userId: string): Promise<Documents> {
    const document = await this.checkDocument(id);
    if (document.workflow === null) {
      throw new HttpException(
        'no puedes devolver un documento que no inicio un flujo de trabajo',
        400,
      );
    }

    const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
      return entry.receivedUsers.some((user) => user.idOfUser === userId);
    });

    if (!bitacoraEntry) {
      throw new HttpException(
        `Usuario con ID: ${userId} no tiene permiso para completar este documento`,
        403,
      );
    }

    const receivedUsers = bitacoraEntry.receivedUsers;
    const lastReceivedUser = receivedUsers[receivedUsers.length - 1];

    if (lastReceivedUser.idOfUser === userId) {
      // El usuario actual es el último en recibir el documento
      const pasos = document.workflow.pasos;
      const currentStepIndex = document.workflow.pasoActual - 1;

      if (currentStepIndex === pasos.length - 1) {
        lastReceivedUser.stateDocumentUser = 'CONCLUIDO';
        document.userReceivedDocument.map((entry) => {
          if (entry.idOfUser === userId) {
            entry.stateDocumentUser = 'CONCLUIDO';
          }
        });
        document.stateDocumetUser = 'CONCLUIDO';
        document.stateDocumentUserSend = 'CONCLUIDO';
        await document.save();
        return document;
      } else {
        throw new HttpException(
          `No se puede marcar como completado en este momento. Aún hay pasos pendientes en el flujo de trabajo.`,
          400,
        );
      }
    } else {
      throw new HttpException(
        `Usuario con ID: ${userId} no es el último en recibir el documento`,
        403,
      );
    }
  }

  async showRecievedDocumentWithouWorkflow(
    userId: string,
  ): Promise<Documents[]> {
    return await this.getDocumentsService.getRecievedDocumentsWithWorkflow(
      userId,
    );
  }

  async showRecievedDocument(idUser: string): Promise<Documents[]> {
    return await this.getDocumentsService.getRecievedDocument(idUser);
  }

  async showAllDocumentSend(userId: string): Promise<Documents[]> {
    return await this.getDocumentsService.getAllDocumentSent(userId);
  }

  async showAllDocumentsCompleted(userId: string): Promise<Documents[]> {
    return await this.getDocumentsService.getAllDocumentsCompleted(userId);
  }

  async showDocumentsMarkComplete(userId: string) {
    return await this.getDocumentsService.getDocumentsMarkComplete(userId);
  }

  async showAllDocumentsSendWithoutWorkflow(
    userId: string,
  ): Promise<Documents[]> {
    return await this.getDocumentsService.getAllDocumentsSentWithoutWorkflow(
      userId,
    );
  }

  async getDocumentsOnHold(userId: string): Promise<Documents[]> {
    return await this.getDocumentsService.getDocumentsOnHold(userId);
  }

  async selectPasoAnterior(
    documentId: string,
    numberPaso: number,
    motivo: string,
    userId: string,
  ): Promise<Documents> {
    return await this.sendDerivedDocumentsService.selectPreviousStep(
      documentId,
      numberPaso,
      motivo,
      userId,
    );
  }

  async findDocumentsByUserIdAndObservation(
    userId: string,
  ): Promise<Documents[]> {
    return await this.getDocumentsService.getDocumentsByUserIdAndObservation(
      userId,
    );
  }

  async filterParams(filter: DocumentsFilter): Promise<Documents[]> {
    const query = {};
    if (filter.numberDocument) {
      query['numberDocument'] = filter.numberDocument;
    }
    if (filter.userId) {
      query['userId'] = filter.userId;
    }
    if (filter.title) {
      query['title'] = filter.title;
    }
    if (filter.typeName) {
      query['documentationType'] = {
        $elemMatch: { documentationType: filter.typeName },
      };
    }
    if (filter.stateDocumentUserSend) {
      query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
    }
    if (filter.nombre) {
      query['workflow'] = {
        $elemMatch: { nombre: filter.nombre },
      };
    }
    if (filter.descriptionWorkflow) {
      query['workflow'] = {
        $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
      };
    }
    if (filter.step) {
      query['workflow.step'] = {
        $elemMatch: { step: filter.step },
      };
    }
    if (filter.paso) {
      query['workflow.step.pasos'] = {
        $elemMatch: { paso: filter.paso },
      };
    }
    if (filter.oficina) {
      query['workflow.step.pasos'] = {
        $elemMatch: { oficina: filter.oficina },
      };
    }
    if (filter.completado) {
      query['workflow.step.pasos'] = {
        $elemMatch: { completado: filter.completado },
      };
    }
    if (filter.pasoActual) {
      query['workflow'] = {
        $elemMatch: { pasoActual: filter.pasoActual },
      };
    }
    if (filter.oficinaActual) {
      query['workflow'] = {
        $elemMatch: { oficinaActual: filter.completado },
      };
    }
    if (filter.description) {
      query['description'] = filter.description;
    }
    if (filter.active) {
      query['active'] = filter.active;
    }
    if (filter.year) {
      query['year'] = filter.year;
    }
    const filteredDocuments = await this.documentModel
      .find(query)
      .sort({ numberDocument: 1 })
      .exec();
    for (const document of filteredDocuments) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
    }
    return filteredDocuments;
  }

  async findAll(): Promise<Documents[]> {
    const documents = await this.documentModel
      .find()
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    // for (const document of documents) {
    //   if (document.userId) {
    //     try {
    //       const res = await this.httpService
    //         .get(`${this.apiPersonalGet}/${document.userId}`)
    //         .toPromise();
    //       document.userInfo = {
    //         name: res.data.name,
    //         lastName: res.data.lastName,
    //         ci: res.data.ci,
    //         email: res.data.email,
    //         unity: res.data.unity,
    //       };
    //     } catch (error) {
    //       document.userId = 'no se encontraron datos del usuario';
    //     }
    //   }
    // }
    return documents;
  }

  async findDocumentsActive(query: any): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
    }
    return documents;
  }

  async findDocumentsInactive(query: any): Promise<Documents[]> {
    const documents = await this.documentModel
      .find(query, { active: false })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
    }
    return documents;
  }

  async findDocumentsArchivedUser(userId: string): Promise<Documents[]> {
    const document = this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'ARCHIVADO' })
      .exec();
    return document;
  }

  async findAllPaginate(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;

    const documents = await this.documentModel
      .find({ active: true })
      .limit(limit)
      .skip(offset);
    // for (const document of documents) {
    //   if (document.userId) {
    //     try {
    //       const res = await this.httpService
    //         .get(`${this.apiPersonalGet}/${document.userId}`)
    //         .toPromise();
    //       document.userInfo = {
    //         name: res.data.name,
    //         lastName: res.data.lastName,
    //         ci: res.data.ci,
    //         email: res.data.email,
    //         unity: res.data.unity,
    //       };
    //     } catch (error) {
    //       document.userId = 'no se encontraron datos del usuario';
    //     }
    //   }
    // }
    const total = await this.documentModel.countDocuments().exec();

    return {
      data: documents,
      total: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Documents> {
    const documents = await this.documentModel.findOne({ _id: id }).exec();
    if (!documents) {
      throw new HttpException('this document not exist', 400);
    }
    if (documents.active === false) {
      throw new HttpException(`documento con id: ${id} fue eliminado`, 404);
    }
    if (documents.userId) {
      try {
        const res = await this.httpService
          .get(`${this.apiPersonalGet}/${documents.userId}`)
          .toPromise();
        documents.userInfo = {
          name: res.data.name,
          lastName: res.data.lastName,
          ci: res.data.ci,
          email: res.data.email,
          unity: res.data.unity,
        };
      } catch (error) {
        documents.userId = 'no se encontraron datos del usuario';
      }
    }
    return documents;
  }

  async findOneUser(id: string, userId: string): Promise<Documents> {
    const documents = await this.documentModel.findOne({ _id: id }).exec();
    if (documents.active === false) {
      throw new HttpException(`documento con id: ${id} fue eliminado`, 404);
    }
    if (documents.userId !== userId) {
      throw new HttpException('not is your document', 400);
    }
    if (documents.userId) {
      try {
        const res = await this.httpService
          .get(`${this.apiPersonalGet}/${documents.userId}`)
          .toPromise();
        documents.userInfo = {
          name: res.data.name,
          lastName: res.data.lastName,
          ci: res.data.ci,
          email: res.data.email,
          unity: res.data.unity,
        };
      } catch (error) {
        documents.userId = 'no se encontraron datos del usuario';
      }
    }
    return documents;
  }

  async getDocumentByUserId(userId: string): Promise<Documents[]> {
    const documents = this.documentModel.find({ userId: userId }).exec();
    if (!documents) {
      throw new HttpException(
        `no se encontro documentos de usuario ${userId}`,
        404,
      );
    }
    return documents;
  }

  async getDocumentVersion(id: string, version: number): Promise<Documents> {
    const documents = await this.documentModel
      .findOne({ _id: id })
      .select('__v')
      .lean()
      .exec();
    if (documents.idTemplate) {
      try {
        const res = await this.httpService
          .get(`${this.apiFilesUploader}/file/${documents.idTemplate}`)
          .toPromise();
        documents.base64Template = res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro datos', 404);
      }
    }
    if (documents.userId) {
      try {
        const res = await this.httpService
          .get(`${this.apiPersonalGet}/${documents.userId}`)
          .toPromise();
        documents.userInfo = {
          name: res.data.name,
          lastName: res.data.lastName,
          ci: res.data.ci,
          email: res.data.email,
          unity: res.data.unity,
        };
      } catch (error) {
        documents.userId = 'no se encontraron datos del usuario';
      }
    }
    if (!documents) {
      throw new NotFoundException('Versión del documento no encontrada');
    }

    return documents;
  }

  async addComment(id: string, comment: any, userId: string) {
    let document: DocumentDocument = await this.documentModel.findById(id);
    document.comments.push(comment);
    const userIdData = userId;
    document.milestone.map((dat) => (dat.userId = userIdData));
    document.save();
    return document;
  }

  async addMilestones(id: string, milestone: any, userId: string) {
    let document: DocumentDocument = await this.documentModel.findById(id);
    document.milestone.push(milestone);
    const userIdData = userId;
    document.milestone.map((dat) => (dat.userId = userIdData));
    await document.save();
    return document;
  }

  async inactiverDocument(id: string, active: boolean) {
    const document: DocumentDocument = await this.documentModel.findById(id);
    if (
      document.workflow === null ||
      document.stateDocumentUserSend === 'COMPLETADO'
    ) {
      document.active = false;
      document.stateDocumentUserSend = 'ARCHIVADO';
      await document.save();
      return document;
    } else {
      throw new HttpException(
        'documento no valido para archivar por que sigue un workflow sin completar',
        400,
      );
    }
  }

  async activerDocument(id: string, active: boolean) {
    const document: DocumentDocument = await this.documentModel.findById(id);
    if (document.active === true) {
      throw new HttpException('el documento ya esta activo', 400);
    }
    document.active = true;
    if (document.workflow === null) {
      document.stateDocumentUserSend = 'EN ESPERA';
      await document.save();
      return document;
    }
    if (document.stateDocumetUser === 'CONCLUIDO') {
      document.stateDocumentUserSend = 'CONCLUIDO';
      await document.save();
      return document;
    }

    if (
      document.stateDocumetUser === 'DERIVADO' ||
      document.stateDocumetUser === 'RECIBIDO'
    ) {
      document.stateDocumentUserSend = 'INICIADO';
      await document.save();
      return document;
    }

    await document.save();
    return document;
  }

  async addDocumentationType(typeName: string): Promise<any> {
    const documentationType =
      await this.findDocumentationTypeService.findDocumentationType(typeName);
    return documentationType;
  }

  fetchAdditionalData(id: string): Observable<any> {
    const url = `${this.apiFilesUploader}/file/${id}`;
    return this.httpService.get(url).pipe(
      map((response: AxiosResponse) => {
        const formattedData = {
          file: {
            mime: response.headers['content-Type'],
            data: response.data,
          },
        };
        return formattedData;
      }),
    );
  }

  //----- FUNCIONES QUE SE USAN ------

  //--FUNCION PARA OBTENER UN DOCUMENTO Y VALIDARLO
  private async checkDocument(id: string) {
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new HttpException(`El documento no fue encontrado`, 404);
    }
    if (document.active === false) {
      throw new HttpException('El documento fue archivado o eliminado', 400);
    }
    return document;
  }

  //--FUNCION PARA CREAR UN NUEVO DOCUMENTO
  private async functionCreateDocument(
    createDocumentDTO: CreateDocumentDTO,
    documentationTypeData: DocumentationType,
    userId,
  ): Promise<Documents> {
    const newDocument = new this.documentModel({
      ...createDocumentDTO,
      filesRegister: null,
      documentationType: documentationTypeData,
      stateDocumentUserSend: 'EN ESPERA',
      userId: userId,
    });
    return newDocument.save();
  }

  //--FUNCION PARA OBTENER LOS DATOS NECESARIOS DEL DOCUMENTO OBTENIDO DEL SERVICIO FILE
  private createFileRegister(fileData: any): any {
    const { _id, status, extension } = fileData;
    return {
      idFile: _id,
      status,
      extension,
    };
  }

  //--FUNCION PARA SUBIR UN FILEBASE64 AL SERVICIO FILE Y OBTENER SUS DATOS
  private async uploadFile(fileObj: {
    mime: string;
    base64: string;
  }): Promise<any> {
    return this.httpService
      .post(`${this.apiFilesUploader}/files/upload`, { file: fileObj })
      .toPromise();
  }

  //--FUNCION PARA OBTENER EL MIME Y EL BASE64 DE UN FILE
  private extractFileData(file: string): { mime: string; base64: string } {
    const mimeType = file.split(';')[0].split(':')[1];
    const base64 = file.split(',')[1];
    return { mime: mimeType, base64 };
  }

  //FUNCION PARA ENCONTRAR WORKFLOW POR NOMBRE
  async findWorkflowByName(workflowName: string) {
    const workflowData = await this.workflowModel
      .findOne({ nombre: workflowName })
      .exec();
    if (!workflowData) {
      throw new HttpException('No se encontro nombre del worflow', 404);
    }
    if (workflowData.activeWorkflow === false) {
      throw new HttpException('El workflow puesto está inactivo', 400);
    }
    return workflowData;
  }

  private async convertDocxToPdf(inputPath: Buffer, outputPath: Buffer) {
    return new Promise<string>((resolve, reject) => {
      docxConverter(inputPath, outputPath, (err: any, result: string) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log('Result: ' + result);
          resolve(result);
        }
      });
    });
  }
}
