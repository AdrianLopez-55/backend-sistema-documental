import {
  HttpException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { UpdateDocumentDTO } from './dto/updateDocument.dto';
import { CreateDocumentDTO, FileDto } from './dto/createDocument.dto';
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
import { off } from 'process';
import {
  EstadoUbiacion,
  EstadoUbiacionDocument,
} from 'src/estado-ubicacion/schema/estado-ubicacion.schema';
import { File, FileDocument } from 'src/file/schema/file.schema';
import { FilterDocumentsAll } from './dto/filterDocumentsAll';
import { PreviewFileDto } from './dto/previewFile.dto';

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
    @InjectModel(EstadoUbiacion.name)
    private readonly estadoUbiacionModel: Model<EstadoUbiacionDocument>,
    @InjectModel(File.name)
    private readonly fileModel: Model<FileDocument>,
  ) {}

  /*
  async createMultiDocumentsWithWorkflow(userId: string) {
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
    const numberOfDocumentsToGenerate = 3000;
    const DocumentsSchema = new mongoose.Schema({
      numberDocument: String,
      userId: String,
      title: String,
      description: String,
      documentationType: Object,
      stateDocumentUserSend: String,
      workflow: Object,
      fileRegister: Array,
      active: Boolean,
      userReceivedDocument: Array,
      bitacoraWorkflow: Array,
      estado_Ubicacion: Object,
      // year: String,
      // state: String,
      oficinaPorPasar: String,
      oficinaActual: String,
      // stateDocumetUser: String,
      // userInfo: Object,
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
        description: `description-${i + 1}`,
        documentationType: {
          typeName: 'LICENCIA',
          idTemplateDocType: `description-${i + 1}`,
          activeDocumentType: true,
          dataUriTemplate: '',
          createdAt: undefined,
          updateAt: undefined,
        },
        stateDocumentUserSend: `INICIADO`,
        workflow: {
          nombre: 'WORKFLOW Z',
          descriptionWorkflow: 'TEST',
          pasos: [
            // {
            //   paso: 1,
            //   idOffice: '65084336717fc4c1b23d1452',
            //   oficina: 'DIRECCION POSTGRADO',
            //   completado: true,
            // },
            {
              paso: 1,
              idOffice: '65084413717fc4c1b23d145e',
              oficina: 'DIRECCION POSTGRADO',
              completado: true,
            },
            // {
            //   paso: 2,
            //   idOffice: '65084467717fc4c1b23d1468',
            //   oficina: 'VICERECTORADO',
            //   completado: false,
            // },
          ],
          // idStep: '65240c3d7ba0128f73a8749f',
          idStep: '652fdb69fd6e3fc5ee9feafa',
          oficinaActual: 'DIRECCION POSTGRADO',
          updateAt: new Date(),
          activeWorkflow: true,
          pasoActual: 1,
          createdAt: undefined,
        },
        active: true,
        // year: `2023`,
        // state: `create`,
        userReceivedDocument: [
          {
            ciUser: '72838934',
            idOfUser: '652e8e8af04daade67239462',
            nameOfficeUserRecieved: 'DIRECCION POSTGRADO',
            dateRecived: new Date(),
            stateDocumentUser: 'RECIBIDO',
            observado: false,
          },
        ],
        bitacoraWorkflow: [
          {
            oficinaActual: '65084413717fc4c1b23d145e',
            nameOficinaActual: 'DIRECCION POSTGRADO',
            userSend: '652e9f133888a663eb8b979a',
            dateSend: new Date(),
            userDerived: '',
            datedDerived: null,
            receivedUsers: [
              {
                ciUser: '72838934',
                idOfUser: '652e8e8af04daade67239462',
                nameOfficeUserRecieved: 'DIRECCION POSTGRADO',
                dateRecived: new Date(),
                stateDocumentUser: 'RECIBIDO',
                observado: false,
              },
            ],
            oficinasPorPasar: [
              {
                paso: 1,
                idOffice: '65084413717fc4c1b23d145e',
                oficina: 'DIRECCION POSTGRADO',
                completado: true,
              },
            ],
            motivoBack: 'se envio documento a personal seleccionado',
          },
        ],
        oficinaActual: 'DIRECCION POSTGRADO',
        oficinaPorPasar: '',
        // stateDocumetUser: 'RECIBIDO',
        
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

  */

  async createMultiDocumentsWithWorkflow(userId: string) {
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
    const numberOfDocumentsToGenerate = 50000;
    const DocumentsSchema = new mongoose.Schema({
      numberDocument: String,
      userId: String,
      title: String,
      description: String,
      documentationType: Object,
      stateDocumentUserSend: String,
      workflow: Object,
      fileRegister: Array,
      active: Boolean,
      userReceivedDocument: Array,
      bitacoraWorkflow: Array,
      estado_Ubicacion: Object,
      // year: String,
      // state: String,
      oficinaPorPasar: String,
      oficinaActual: String,
      // stateDocumetUser: String,
      // userInfo: Object,
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
        description: `description-${i + 1}`,
        documentationType: {
          typeName: 'LICENCIA',
          // idTemplateDocType: `description-${i + 1}`,
          activeDocumentType: true,
          createdAt: undefined,
          updateAt: undefined,
        },
        stateDocumentUserSend: `INICIADO`,
        workflow: {
          nombre: 'WORKFLOW A',
          descriptionWorkflow: 'STRING',
          pasos: [
            // {
            //   paso: 1,
            //   idOffice: '65084336717fc4c1b23d1452',
            //   oficina: 'DIRECCION POSTGRADO',
            //   completado: true,
            // },
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
          // idStep: '652fdb69fd6e3fc5ee9feafa',
          oficinaActual: 'RECTORADO',
          updateAt: new Date(),
          activeWorkflow: true,
          pasoActual: 1,
          createdAt: undefined,
        },
        active: true,
        // year: `2023`,
        // state: `create`,
        userReceivedDocument: [
          {
            ciUser: '444888777',
            idOfUser: '64e84144561052a834987264',
            name: 'example',
            lastName: 'example2',
            nameOfficeUserRecieved: 'RECTORADO',
            dateRecived: new Date(),
            stateDocumentUser: 'RECIBIDO',
            // nameUser: '',
            observado: false,
          },
        ],
        bitacoraWorkflow: [
          {
            oficinaActual: '65084413717fc4c1b23d145e',
            nameOficinaActual: 'DIRECCION POSTGRADO',
            userSend: '652e9f133888a663eb8b979a',
            dateSend: new Date(),
            userDerived: '',
            datedDerived: null,
            receivedUsers: [
              {
                ciUser: '72838934',
                idOfUser: '652e8e8af04daade67239462',
                name: 'asdfaf',
                lastName: 'afaf',
                nameOfficeUserRecieved: 'DIRECCION POSTGRADO',
                // nameUser: '',
                dateRecived: new Date(),
                stateDocumentUser: 'RECIBIDO',
                observado: false,
              },
            ],
            oficinasPorPasar: [
              {
                paso: 1,
                idOffice: '65084413717fc4c1b23d145e',
                oficina: 'DIRECCION POSTGRADO',
                completado: true,
              },
            ],
            motivoBack: 'se envio documento a personal seleccionado',
          },
        ],
        oficinaActual: 'DIRECCION POSTGRADO',
        oficinaPorPasar: '',
        // stateDocumetUser: 'RECIBIDO',

        fileRegister: [
          {
            idFile: '6536dce2a381cde8eefcf570',
          },
          {
            idFile: '6536dce3a381cde8eefcf572',
          },
        ],
        estado_Ubicacion: {
          idDocument: '',
          estado_ubi: [
            {
              stateOffice: 'EN ESPERA',
              numberPasoOffice: null,
              receivedUsers: [
                {
                  ciUser: '8845784',
                  idOfUser: '',
                  name: 'example',
                  lastName: 'examplet',
                  nameOfficeUserRecieved: '',
                  dateRecived: null,
                  // nameUser: '',
                  stateDocumentUser: 'EN ESPERA',
                  observado: false,
                },
              ],
              activo: true,
              oficinas_falta: [],
              nameOffices: 'asd',
            },
            {
              nameOffices: 'asdf',
              stateOffice: 'ENVIADO',
              numberPasoOffice: null,
              receivedUsers: [
                {
                  ciUser: '',
                  idOfUser: '',
                  name: 'exame',
                  lastName: 'easd',
                  nameOfficeUserRecieved: '',
                  dateRecived: null,
                  // nameUser: '',
                  stateDocumentUser: 'RECIBIDO',
                  observado: false,
                },
              ],
              activo: false,
              oficinas_falta: [],
            },
          ],
          createdAt: undefined,
          updateAt: undefined,
        },
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

  /*

  async createMultiDocumentswithoutWorkflow(userId: string) {
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
    const numberOfDocumentsToGenerate = 4000;
    const DocumentsSchema = new mongoose.Schema({
      numberDocument: String,
      userId: String,
      title: String,
      documentationType: Object,
      stateDocumentUserSend: String,
      workflow: Object,
      description: String,
      fileRegister: Object,
      active: Boolean,
      year: String,
      state: String,
      userReceivedDocumentWithoutWorkflow: Array,
      bitacoraWithoutWorkflow: Array,
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
        stateDocumentUserSend: `ENVIADO DIRECTO`,
        workflow: null,
        description: `description-${i + 1}`,
        fileRegister: null,
        active: true,
        year: `2023`,
        state: `create`,
        userReceivedDocumentWithoutWorkflow: [
          {
            ciUser: '72838934',
            idOfUser: '652e8e8af04daade67239462',
            nameOfficeUserRecieved: 'DIRECCION POSTGRADO',
            dateRecived: new Date(),
            stateDocumentUser: 'RECIBIDO DIRECTO',
          },
        ],
        bitacoraWithoutWorkflow: [
          {
            idUserSendOrigin: '652e9f133888a663eb8b979a',
            idOfficeUserSend: '65084336717fc4c1b23d1452',
            nameOficeUser: 'VICERECTORADO',
            recievedUsers: [
              {
                ciUser: '72838934',
                idOfUser: '652e8e8af04daade67239462',
                idOffice: '65084413717fc4c1b23d145e',
                nameOficeUserRecieved: 'RECIBIDO DIRECTO',
                stateDocumentUser: 'RECIBIDO DIRECTO',
              },
            ],
          },
        ],
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

  */

  async createMultiDocumentsOnHold(userId: string) {
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
    const numberOfDocumentsToGenerate = 50000;
    const DocumentsSchema = new mongoose.Schema({
      numberDocument: String,
      userId: String,
      title: String,
      description: String,
      documentationType: Object,
      stateDocumentUserSend: String,
      workflow: Object,
      fileRegister: Array,
      active: Boolean,
      estado_Ubicacion: Object,
      // year: String,
      state: String,
    });

    const documentModel = mongoose.model<DocumentDocument>(
      'Document',
      DocumentsSchema,
    );
    const documentsToCreate: Partial<DocumentDocument>[] = [];
    for (let i = 0; i < numberOfDocumentsToGenerate; i++) {
      const newDocument: Partial<DocumentDocument> = {
        numberDocument: `DOC-00${i + 1}-2023`,
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
        description: `description-${i + 1}`,
        documentationType: {
          typeName: 'LICENCIA',
          // idTemplateDocType: `description-${i + 1}`,
          activeDocumentType: true,
          createdAt: undefined,
          updateAt: undefined,
        },
        stateDocumentUserSend: `EN ESPERA`,
        workflow: null,
        fileRegister: [
          {
            idFile: '6539b23808c66a03b72f5655',
          },
          {
            idFile: '6539b23808c66a03b72f5657',
          },
        ],
        active: true,
        estado_Ubicacion: {
          idDocument: '',
          estado_ubi: [
            {
              stateOffice: 'EN ESPERA',
              numberPasoOffice: null,
              receivedUsers: [
                {
                  ciUser: '444888777',
                  idOfUser: '64e84144561052a834987264',
                  name: 'esef',
                  lastName: 'asdfaf',
                  nameOfficeUserRecieved: '',
                  // nameUser: '',
                  dateRecived: null,
                  stateDocumentUser: 'EN ESPERA',
                  observado: false,
                },
              ],
              activo: true,
              oficinas_falta: [],
              nameOffices: '',
            },
          ],
          createdAt: undefined,
          updateAt: undefined,
        },
        // year: `2023`,
        // state: `create`,
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
      mongoose.disconnect();
      mongoose.connection.close();
    }
  }

  //----------------------------------------------------

  async htmlConvertPdf(sendHtmlFileDto: SendHtmlFileDto) {
    const { htmlContent, nameFile, descriptionFile, base64File } =
      sendHtmlFileDto;
    if (htmlContent) {
      if (base64File) {
        throw new HttpException(
          'solo puedes enviar o html o base64, no los dos al mismo tiempo',
          400,
        );
      }
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
    //si en base64 se envia como docx
    if (
      base64File.startsWith(
        'data:@file/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
    ) {
      if (htmlContent) {
        throw new HttpException(
          'solo puedes enviar o html o base64, no los dos al mismo tiempo',
          400,
        );
      }
      // const { mime, base64 } = this.extractFileData(base64File);
      const mimeType = base64File.split(';')[0].split(':')[1];
      const base64 = base64File.split(',')[1];

      const fileObj = {
        mime: mimeType,
        base64: base64,
      };
      const response = await this.uploadFile(fileObj);
      const fileRegister = this.createFileRegister(response.data.file);
      const binaryData = Buffer.from(base64, 'base64');

      //definir ruta y nombre del archivo temporal
      const path = require('path');
      const tempFolder = path.join(process.cwd(), 'template');
      const fileName = `${nameFile}_file.docx`;
      const filePathTemplateDoc = path.join(tempFolder, fileName);
      fs.writeFileSync(filePathTemplateDoc, binaryData);
      //borrar el template descargado
      const timeToLiveInMillisencods = 1 * 60 * 1000;
      setTimeout(() => {
        fs.unlink(filePathTemplateDoc, (err) => {
          if (err) {
            console.error('error al eliminar file', err);
          } else {
            console.log('archivo eliminado', filePathTemplateDoc);
          }
        });
      }, timeToLiveInMillisencods);
      //convertir a pdf
      const inputPath = path.join(
        process.cwd(),
        'template',
        `${nameFile}_file.docx`,
      );
      const outPutDocumentTemplate = path.join(process.cwd(), 'template');
      const outPuthFileName = `${nameFile}_file.pdf`;
      const outPutPathTemplate = path.join(
        outPutDocumentTemplate,
        outPuthFileName,
      );
      await this.convertDocxToPdf(inputPath, outPutPathTemplate);
      const rutaPdfGenerated = path.join(
        process.cwd(),
        'template',
        `${nameFile}_file.pdf`,
      );
      const resultFile = fs.readFileSync(rutaPdfGenerated);
      const base64String = resultFile.toString('base64');
      const fileExtension = path.extname(`${nameFile}_file.pdf`).substring(1);
      const mimeTypePdf = `application/${fileExtension}`;
      const dataPdf = {
        mime: mimeTypePdf,
        base64: base64String,
      };
      // const sentDataDocx = await this.httpService
      //   .post(`${this.apiFilesTemplate}/files/upload-template`, {
      //     templateName: `${nameFile}_file.pdf`,
      //     file: dataPdf,
      //   })
      //   .toPromise();

      const timeToLiveInMIlliseconds = 1 * 60 * 1000;
      setTimeout(() => {
        fs.unlink(rutaPdfGenerated, (err) => {
          if (err) {
            console.error('error al eliminar archivo temporal: ', err);
          } else {
            console.log('Archivo temporal eliminado: ', rutaPdfGenerated);
          }
        });
        fs.unlink(outPutPathTemplate, (err) => {
          if (err) {
            console.error('Error al eliminar archivo temporal PDF: ', err);
          } else {
            console.log('Archivo temporal PDF eliminado: ', outPutPathTemplate);
          }
        });
      }, timeToLiveInMIlliseconds);

      return {
        nameFile: nameFile,
        descriptionFile: descriptionFile,
        pdfBase64: base64String,
      };
    } else {
      //si se envia como pdf
      if (base64File.startsWith('data:@file/pdf')) {
        if (htmlContent) {
          throw new HttpException(
            'solo puedes enviar o html o base64, no los dos al mismo tiempo',
            400,
          );
        }
        // const { mime, base64 } = this.extractFileData(base64File);
        const mimeType = base64File.split(';')[0].split(':')[1];
        const base64 = base64File.split(',')[1];
        const fileObj = {
          mime: mimeType,
          base64: base64,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
        return {
          nameFile: nameFile,
          descriptionFile: descriptionFile,
          pdfBase64: base64,
        };
      }
    }
  }

  async preview(createDocumentDTO: PreviewFileDto) {
    const { html } = createDocumentDTO;
    const responsehtmlPdf = await this.httpService
      .post(`${getConfig().api_convet_html_pdf}/convert/preview`, {
        textPlain: html,
      })
      .toPromise();
    const base64Preview = responsehtmlPdf.data.base64File;

    // const responseBase64 = await this.httpService
    //   .get(`${this.apiFilesTemplate}/file/${idFile}`)
    //   .toPromise();
    return base64Preview;
  }

  async create(createDocumentDTO: CreateDocumentDTO, userId: string) {
    try {
      const { file, documentTypeName, html } = createDocumentDTO;
      console.log('html', html);
      const documentationTypeData =
        await this.findDocumentationTypeService.findDocumentationType(
          documentTypeName,
        );
      if (file || file.length === 0) {
        let fileRegisterData = [];
        if (html) {
          const responsehtmlPdf = await this.httpService
            .post(`${getConfig().api_convet_html_pdf}/convert`, {
              textPlain: html,
            })
            .toPromise();
          const idFile = responsehtmlPdf.data.idFile;
          fileRegisterData.push({ idFile: idFile });
        }

        const fileDataArray = await this.extractFileData(createDocumentDTO);

        for (const fileData of fileDataArray) {
          const { mime, base64 } = fileData;
          console.log('esto es mime', mime);
          if (
            mime.startsWith(
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            )
          ) {
            const binaryData = Buffer.from(base64, 'base64');

            //definir ruta y nombre del archivo temporal
            const path = require('path');
            const tempFolder = path.join(process.cwd(), 'template');
            const fileName = `_file.docx`;
            const filePathTemplateDoc = path.join(tempFolder, fileName);
            fs.writeFileSync(filePathTemplateDoc, binaryData);
            //borrar el template descargado
            const timeToLiveInMillisencods = 1 * 60 * 1000;
            setTimeout(() => {
              fs.unlink(filePathTemplateDoc, (err) => {
                if (err) {
                  console.error('error al eliminar file', err);
                } else {
                  console.log('archivo eliminado', filePathTemplateDoc);
                }
              });
            }, timeToLiveInMillisencods);
            //convertir a pdf
            const inputPath = path.join(
              process.cwd(),
              'template',
              `_file.docx`,
            );
            const outPutDocumentTemplate = path.join(process.cwd(), 'template');
            const outPuthFileName = `_file.pdf`;
            const outPutPathTemplate = path.join(
              outPutDocumentTemplate,
              outPuthFileName,
            );
            await this.convertDocxToPdf(inputPath, outPutPathTemplate);
            const rutaPdfGenerated = path.join(
              process.cwd(),
              'template',
              `_file.pdf`,
            );
            const resultFile = fs.readFileSync(rutaPdfGenerated);
            const base64String = resultFile.toString('base64');
            const fileObj = {
              mime: 'application/pdf',
              base64: base64String,
            };
            const response = await this.uploadFile(fileObj);
            const fileRegister = this.createFileRegister(response.data.file);
            fileRegisterData.push(fileRegister);
          } else {
            const fileObj = {
              mime: mime,
              base64: base64,
            };
            const response = await this.uploadFile(fileObj);
            const fileRegister = this.createFileRegister(response.data.file);
            fileRegisterData.push(fileRegister);
          }
        }
        const newDocument = new this.documentModel({
          ...createDocumentDTO,
          fileRegister: fileRegisterData,
          documentationType: documentationTypeData,
          stateDocumentUserSend: 'EN ESPERA',
          userId: userId,
          htmlDoc: html,
        });

        const loggedUser = await this.httpService
          .get(`${this.apiPersonalGet}/${userId}`)
          .toPromise();
        const userOficce = loggedUser.data.unity;
        const newFileRegister = new this.fileModel({
          idDocument: newDocument._id,
          fileRegister: fileRegisterData,
        });
        await newFileRegister.save();
        const newEstadoUbicacion = new this.estadoUbiacionModel({
          idDocument: newDocument._id,
          estado_ubi: [
            {
              nameOffice: userOficce,
              stateOffice: 'EN ESPERA',
              numberPasoOffice: null,
              receivedUsers: [
                {
                  ciUser: loggedUser.data.ci,
                  idOfUser: userId,
                  name: loggedUser.data.name,
                  lastName: loggedUser.data.lastName,
                  nameOfficeUserRecieved: loggedUser.data.unity,
                  dateRecived: Date.now(),
                  stateDocumentUser: 'EN ESPERA',
                  observado: false,
                },
              ],
              activo: true,
            },
          ],
        });
        await newEstadoUbicacion.save();
        newDocument.estado_Ubicacion = newEstadoUbicacion;
        newDocument.stateDocumentUserRecieved = '';
        await newDocument.save();
        // return newDocument;
        return {
          _id: newDocument._id,
          numberDocument: newDocument.numberDocument,
          userId: newDocument.userId,
          title: newDocument.title,
          description: newDocument.description,
          documentType: newDocument.documentationType,
          stateDocumentUserSend: newDocument.stateDocumentUserSend,
          workflow: newDocument.workflow,
          fileRegister: newDocument.fileRegister,
          active: newDocument.active,
          year: newDocument.year,
          estado_Ubicacion: newDocument.estado_Ubicacion,
        };
      }
      if (file.length === 0 && html === '') {
        const newDocument = new this.documentModel({
          ...createDocumentDTO,
          fileRegister: null,
          documentationType: documentationTypeData,
          stateDocumentUserSend: 'EN ESPERA',
          userId: userId,
          htmlDoc: html,
        });

        const loggedUser = await this.httpService
          .get(`${this.apiPersonalGet}/${userId}`)
          .toPromise();
        const userOficce = loggedUser.data.unity;
        // const newFileRegister = new this.fileModel({
        //   idDocument: newDocument._id,
        //   fileRegister: fileRegisterData,
        // });
        // await newFileRegister.save();
        const newEstadoUbicacion = new this.estadoUbiacionModel({
          idDocument: newDocument._id,
          estado_ubi: [
            {
              nameOffice: userOficce,
              stateOffice: 'EN ESPERA',
              numberPasoOffice: null,
              receivedUsers: [
                {
                  ciUser: loggedUser.data.ci,
                  idOfUser: userId,
                  name: loggedUser.data.name,
                  lastName: loggedUser.data.lastName,
                  nameOfficeUserRecieved: loggedUser.data.unity,
                  dateRecived: Date.now(),
                  stateDocumentUser: 'EN ESPERA',
                  observado: false,
                },
              ],
              activo: true,
            },
          ],
        });
        await newEstadoUbicacion.save();
        newDocument.estado_Ubicacion = newEstadoUbicacion;
        await newDocument.save();
        return {
          _id: newDocument._id,
          numberDocument: newDocument.numberDocument,
          userId: newDocument.userId,
          title: newDocument.title,
          description: newDocument.description,
          documentType: newDocument.documentationType,
          stateDocumentUserSend: newDocument.stateDocumentUserSend,
          workflow: newDocument.workflow,
          fileRegister: newDocument.fileRegister,
          active: newDocument.active,
          year: newDocument.year,
          estado_Ubicacion: newDocument.estado_Ubicacion,
        };
      }
      if (file === null) {
        console.log('esto es file', file);
        let fileRegisterData = [];
        if (html) {
          const responsehtmlPdf = await this.httpService
            .post(`${getConfig().api_convet_html_pdf}/convert`, {
              textPlain: html,
            })
            .toPromise();
          const idFile = responsehtmlPdf.data.idFile;
          fileRegisterData.push({
            idFile: idFile,
          });
          console.log(fileRegisterData);
          const newDocument = new this.documentModel({
            ...createDocumentDTO,
            filesRegister: fileRegisterData,
            documentationType: documentationTypeData,
            stateDocumentUserSend: 'EN ESPERA',
            userId: userId,
            htmlDoc: html,
          });
          await newDocument.save();
          return {
            _id: newDocument._id,
            numberDocument: newDocument.numberDocument,
            userId: newDocument.userId,
            title: newDocument.title,
            description: newDocument.description,
            documentType: newDocument.documentationType,
            stateDocumentUserSend: newDocument.stateDocumentUserSend,
            workflow: newDocument.workflow,
            fileRegister: newDocument.fileRegister,
            active: newDocument.active,
            year: newDocument.year,
            estado_Ubicacion: newDocument.estado_Ubicacion,
          };
          return this.functionCreateDocument(
            createDocumentDTO,
            documentationTypeData,
            userId,
          );
        }
      }
    } catch (error) {
      throw new Error(`error encontrado: ${error}`);
    }
  }

  //-------------------------------------
  //aumentar files a un dcumento
  async addFilesDocument(id: string, createDocumentDto: CreateDocumentDTO) {
    const document = await this.documentModel.findById(id).exec();
    const { file } = createDocumentDto;
    if (file) {
      const fileDataArray = this.extractFileData(createDocumentDto);

      for (const fileData of fileDataArray) {
        const { mime, base64 } = fileData;
        const fileObj = {
          mime: mime,
          base64: base64,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
      }
    }
  }

  /*
  async showBase64TemplateDoc(id: string) {
    const document = await this.checkDocument(id);
    const idTemplateFromDoc = document.documentationType.idTemplateDocType;
    const getBase64Template = await this.httpService
      .get(`${this.apiFilesUploader}/file/template/${idTemplateFromDoc}`)
      .toPromise();
    const base64TemplateDoc = getBase64Template.data.file.base64;

    //--decodificar base64 a dats binarios
    const binaryData = Buffer.from(base64TemplateDoc, 'base64');
    // binaryData = fs.readFileSync('path_to_your_document.docx');
    console.log('binaryData: ', binaryData);

    //--especificar ruta y nombre del archivo temporal
    const path = require('path');
    const tempFolder = path.join(process.cwd(), 'template');
    const fileName = `${document.documentationType.typeName}.docx`;
    const filePathTemplateDoc = path.join(tempFolder, fileName);
    //esto es elarchivo docx del template de tipo de documento guardado en el archivo template
    console.log(filePathTemplateDoc);
    fs.writeFileSync(filePathTemplateDoc, binaryData);

    //---borrar el template, hacerlo temporal

    // const timeToLiveInMIllisecondsTemplate = 10 * 60 * 1000;
    // setTimeout(() => {
    //   fs.unlink(filePathTemplateDoc, (err) => {
    //     if (err) {
    //       console.error('error al eliminar archivo temporal: ', err);
    //     } else {
    //       console.log('Archivo temporal eliminado: ', filePathTemplateDoc);
    //     }
    //   });
    // }, timeToLiveInMIllisecondsTemplate);

    const rutaTemplate = await path.join(
      process.cwd(),
      'template',
      `${document.documentationType.typeName.toUpperCase()}.docx`,
    );
    const templatefile = fs.readFileSync(filePathTemplateDoc);
    console.log('templatefile', templatefile);
    const outPath = path.join(
      process.cwd(),
      'template',
      `${document.documentationType.typeName.toUpperCase()}.docx`,
    );
    const templatefileDat = fs.readFileSync(outPath);
    const data = {
      // nameTemplate: document.documentationType.typeName,
      numberDocument: 'prueba number document',
      // title: document.title,
      // description: document.description,
    };
    const handler = new TemplateHandler();

    const doc = await handler.process(templatefileDat, data);
    const fileNameDoc = `${document.documentationType.typeName}_${document.numberDocument}.docx`;
    const fileNamePdf = `${document.documentationType.typeName}_${document.numberDocument}.pdf`;
    const templateDirectorySave = path.join(process.cwd(), 'template');
    const filePathDoc = path.join(templateDirectorySave, fileNameDoc);
    fs.writeFileSync('myTemplate.docx', doc);
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

    // const timeToLiveInMIlliseconds = 30 * 1000;

    // setTimeout(() => {
    //   fs.unlink(filePathDoc, (err) => {
    //     if (err) {
    //       console.error('error al eliminar archivo temporal: ', err);
    //     } else {
    //       console.log('Archivo temporal eliminado: ', filePathDoc);
    //     }
    //   });

    //   fs.unlink(outputhPathTemplate, (err) => {
    //     if (err) {
    //       console.error('Error al eliminar archivo temporal PDF: ', err);
    //     } else {
    //       console.log('Archivo temporal PDF eliminado: ', outputhPathTemplate);
    //     }
    //   });
    // }, timeToLiveInMIlliseconds);
    document.idTemplate = sentDataDocx.data.file._id;
    await document.save();
    const idDocument = id;
    const idTemplate = document.idTemplate;
    const base64Template = base64String;
    let showDocument = { idDocument, idTemplate, base64Template };
    return showDocument;
  }
  */

  async update(id: string, updateDocumentDTO: UpdateDocumentDTO) {
    const documentationType =
      await this.findDocumentationTypeService.findDocumentationType(
        updateDocumentDTO.documentTypeName,
      );
    const { file } = updateDocumentDTO;

    if (file) {
      const fileDataArray = await this.extractFileData(updateDocumentDTO);

      let fileRegisterData = [];
      for (const fileData of fileDataArray) {
        const { mime, base64 } = fileData;
        const fileObj = {
          mime: mime,
          base64: base64,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
        fileRegisterData.push(fileRegister);
      }
      const updateDocument = {
        ...updateDocumentDTO,
        fileRegister: fileRegisterData,
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

  //-----------------------------------------------------------

  async obtainDocuments(
    userId: string,
    view: string,
    withWorkflow: string,
    filterAll: FilterDocumentsAll,
    dateRange: { startDate: Date; endDate: Date },
    dateRangeRecived: { startDateRecived: Date; endDateRecived: Date },
  ) {
    // console.log('entra al servicioooooooooo');
    return await this.getDocumentsService.getDocuments(
      userId,
      view,
      withWorkflow,
      filterAll,
      dateRange,
      dateRangeRecived,
    );
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

  //--funciones para recibir
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

      await document.save();
      return document;
    } else {
      throw new HttpException(
        'No se puede marcar como revisado en este momento. El siguiente paso ya está completado o no existe.',
        403,
      );
    }
  }

  async functionObtainAndDerivedDocument(
    documents: Documents[],
    userId: string,
  ) {
    let showDocuments = [];
    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
      const filteredDocumentsUserSome = document.userReceivedDocument.some(
        (entry) => {
          return entry.idOfUser === userId;
        },
      );
      if (filteredDocumentsUserSome) {
        // document.stateDocumetUser = 'RECIBIDO';
        showDocuments.push(document);
      }
      if (
        !filteredDocumentsUserSome
        // document.stateDocumetUser === 'DERIVADO'
      ) {
        showDocuments.push(document);
      }
    }
    showDocuments.sort((a, b) => {
      const dateA = new Date(a.userReceivedDocument[0]?.dateRecived).getTime();
      const dateB = new Date(b.userReceivedDocument[0]?.dateRecived).getTime();
      return dateB - dateA;
    });
    return showDocuments;
  }

  async getDocumentsReviewed(userId: string) {
    return await this.getDocumentsService.getDocumentReviewed(userId);
  }

  async markDocumentcompleted(id: string, userId: string): Promise<Documents> {
    const document = await this.checkDocument(id);
    if (document.workflow === null) {
      throw new HttpException(
        'no puedes marcar como completado un documento que no inicio un flujo de trabajo',
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
        // document.stateDocumetUser = 'CONCLUIDO';
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
    // const query = {};
    let query = this.documentModel.find();

    if (filter.numberDocument) {
      // query['numberDocument'] = filter.numberDocument;
      query = query.where(
        'numberDocument',
        new RegExp(filter.numberDocument, 'i'),
      );
    }
    if (filter.userId) {
      // query['userId'] = filter.userId;
      query = query.where('userId', new RegExp(filter.userId, 'i'));
    }
    if (filter.title) {
      // query['title'] = filter.title;
      query = query.where('title', new RegExp(filter.title, 'i'));
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
    // if (filter.step) {
    //   query['workflow.step'] = {
    //     $elemMatch: { step: filter.step },
    //   };
    // }
    // if (filter.paso) {
    //   query['workflow.step.pasos'] = {
    //     $elemMatch: { paso: filter.paso },
    //   };
    // }
    // if (filter.oficina) {
    //   query['workflow.step.pasos'] = {
    //     $elemMatch: { oficina: filter.oficina },
    //   };
    // }
    // if (filter.completado) {
    //   query['workflow.step.pasos'] = {
    //     $elemMatch: { completado: filter.completado },
    //   };
    // }
    // if (filter.pasoActual) {
    //   query['workflow'] = {
    //     $elemMatch: { pasoActual: filter.pasoActual },
    //   };
    // }
    // if (filter.oficinaActual) {
    //   query['workflow'] = {
    //     $elemMatch: { oficinaActual: filter.completado },
    //   };
    // }
    if (filter.description) {
      // query['description'] = filter.description;
      query = query.where('description', new RegExp(filter.description, 'i'));
    }
    if (filter.active) {
      // query['active'] = filter.active;
      query = query.where('active', filter.active);
    }
    if (filter.year) {
      // query['year'] = filter.year;
      query = query.where('year', filter.year);
    }
    const filteredDocuments = await this.documentModel
      .find(query)
      .sort({ numberDocument: 1 })
      .exec();
    for (const document of filteredDocuments) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
    }
    return filteredDocuments;
  }

  async findAll(): Promise<Documents[]> {
    const documents = await this.documentModel
      .find()
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    return documents;
  }

  async findDocumentsActive(query: any): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
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
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
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
    // if (documents.userId) {
    //   try {
    //     const res = await this.httpService
    //       .get(`${this.apiPersonalGet}/${documents.userId}`)
    //       .toPromise();
    //     documents.userInfo = {
    //       name: res.data.name,
    //       lastName: res.data.lastName,
    //       ci: res.data.ci,
    //       email: res.data.email,
    //       unity: res.data.unity,
    //     };
    //   } catch (error) {
    //     documents.userId = 'no se encontraron datos del usuario';
    //   }
    // }
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
    // if (documents.userId) {
    //   try {
    //     const res = await this.httpService
    //       .get(`${this.apiPersonalGet}/${documents.userId}`)
    //       .toPromise();
    //     documents.userInfo = {
    //       name: res.data.name,
    //       lastName: res.data.lastName,
    //       ci: res.data.ci,
    //       email: res.data.email,
    //       unity: res.data.unity,
    //     };
    //   } catch (error) {
    //     documents.userId = 'no se encontraron datos del usuario';
    //   }
    // }
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
        // documents.base64Template = res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro datos', 404);
      }
    }
    // if (documents.userId) {
    //   try {
    //     const res = await this.httpService
    //       .get(`${this.apiPersonalGet}/${documents.userId}`)
    //       .toPromise();
    //     documents.userInfo = {
    //       name: res.data.name,
    //       lastName: res.data.lastName,
    //       ci: res.data.ci,
    //       email: res.data.email,
    //       unity: res.data.unity,
    //     };
    //   } catch (error) {
    //     documents.userId = 'no se encontraron datos del usuario';
    //   }
    // }
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
    // if (document.stateDocumetUser === 'CONCLUIDO') {
    //   document.stateDocumentUserSend = 'CONCLUIDO';
    //   await document.save();
    //   return document;
    // }

    // if (
    //   // document.stateDocumetUser === 'DERIVADO' ||
    //   // document.stateDocumetUser === 'RECIBIDO'
    // ) {
    //   document.stateDocumentUserSend = 'INICIADO';
    //   await document.save();
    //   return document;
    // }

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
    const { _id } = fileData;
    return {
      idFile: _id,
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
  // private extractFileData(files: string[]): { mime: string; base64: string }[] {
  //   for (const file of files) {
  //     const mimeType = file.split(';')[0].split(':')[1];
  //     const base64 = file.split(',')[1];
  //     return { mime: mimeType, base64 };
  //   }
  // }
  private extractFileData(
    createDocumentDTO: CreateDocumentDTO,
  ): { mime: string; base64: string }[] {
    const fileDataArray: { mime: string; base64: string }[] = [];
    for (const file of createDocumentDTO.file) {
      const mimeType = file.split(';')[0].split(':')[1];
      const base64 = file.split(',')[1];
      fileDataArray.push({ mime: mimeType, base64 });
    }
    return fileDataArray;
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
