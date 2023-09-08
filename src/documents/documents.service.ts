import {
  HttpException,
  Injectable,
  NotFoundException,
  GatewayTimeoutException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateDocumentDTO } from './dto/updateDocument.dto';
import { CreateDocumentDTO } from './dto/createDocument.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { Request } from 'express';
import { PaginationDto } from '../common/pagination.dto';
import { HttpService } from '@nestjs/axios';
import { DocumentationTypeService } from 'src/documentation-type/documentation-type.service';
import {
  DocumentationType,
  DocumentationTypeDocument,
} from 'src/documentation-type/schema/documentation-type.schema';
import { ObtainDataDocumentationTypeDto } from './dto/documentation-type-result.dto';
import getConfig from '../config/configuration';
import { ApiService } from 'src/ServiceApi/api.service';
import { FilterDto } from './dto/filter.dto';
import { WorkflowService } from 'src/workflow/workflow.service';
import {
  Workflow,
  WorkflowDocuments,
} from 'src/workflow/schemas/workflow.schema';
import * as PDFDocument from 'pdfkit';
import { DocumentsFilter } from './dto/documents-filter.dto';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { map } from 'rxjs/operators';

import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';
import { TemplateHandler } from 'easy-template-x';
import * as path from 'path';
import { CustomErrorService } from 'src/error.service';
import { SendToEmployeedDto } from './dto/sendToEmployeed.dto';
import { SendOptionsDto } from './dto/sendOption.dto';
import { PersonalGetService } from 'src/personal-get/personal-get.service';
import { UpdateSteDocumentDto } from './dto/updatesteDocument.dto';
import { StepService } from 'src/step/step.service';
import { AddWorkflowDocumentDto } from './dto/addWorkflowDocument.dto';
import { AddWorkflowSinCiDocumentDto } from './dto/addWorkflowSinCiDocument.dto';
import * as officegen from 'officegen';
import * as pdfkit from 'pdfkit';
// import * as libre from 'libreoffice-convert'
// import * as path from 'path';
// import * as fs from 'fs/promises';
import { promisify } from 'util';
import * as libre from 'libreoffice-convert';
// declare module 'libreoffice-convert' {
//   export const convertAsync: (options: any) => Promise<any>;
// }

// libre.convertAsync = promisify(libre.convert);

@Injectable()
export class DocumentsService {
  private defaultLimit: number;
  private readonly apiFilesUploader = getConfig().api_files_uploader;
  private readonly apiFilesTemplate = getConfig().api_files_template;

  constructor(
    @InjectModel(Documents.name)
    private readonly documentModel: Model<DocumentDocument>,
    private readonly httpService: HttpService,
    @InjectModel(DocumentationType.name)
    private documentationTypeModel: Model<DocumentationTypeDocument>,
    private readonly documentationTypeService: DocumentationTypeService,
    // private readonly documentationTypesModel: Model<DocumentationTypeDocument>,
    private readonly apiService: ApiService,
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocuments>,
    private readonly workflowService: WorkflowService,
    private readonly customErrorService: CustomErrorService, // private personalGetService: PersonalGetService,
    private readonly stepService: StepService,
  ) {}

  //---------------------------- create new document ---------------
  async create(
    createDocumentDTO: CreateDocumentDTO,
    //---------------------id user -------
    userId: string,
    //-------------------------------------
  ): Promise<Documents> {
    try {
      //--------------------------------------------------------------------------

      const file = createDocumentDTO.file;
      //--------------------------------------------------------------------------------------------------------
      const { title, documentTypeName, description } = createDocumentDTO;
      const documentationTypeData = await this.documentationTypeModel.findOne({
        typeName: documentTypeName,
      });
      if (!documentationTypeData) {
        throw new HttpException(
          'no se encontro nombre del tipo de documento',
          404,
        );
      }
      //--------------------------------------------------------------------------------------------------------
      if (file != undefined && file !== null) {
        return this.createDocumentWithFile(
          createDocumentDTO,
          documentationTypeData,
          // workflowData,
          userId,
        );
      } else {
        return this.createDocumentWithoutFile(
          createDocumentDTO,
          documentationTypeData,
          userId,
        );
      }
    } catch (error) {
      throw new HttpException('algo salio mal', 400);
    }
  }

  private async createDocumentWithFile(
    createDocumentDTO: CreateDocumentDTO,
    documentationTypeData: DocumentationType,
    userId,
  ): Promise<Documents> {
    const { file } = createDocumentDTO;
    const mimeType = file.split(';')[0].split(':')[1];
    const base64 = file.split(',')[1];
    const fileObj = {
      mime: mimeType,
      base64: base64,
    };
    const response = await this.httpService
      .post(`${this.apiFilesUploader}/files/upload`, { file: fileObj })
      .toPromise();
    const { _id, filename, size, filePath, status, category, extension } =
      response.data.file;
    const fileRegister = {
      _idFile: _id,
      filename,
      size,
      filePath,
      status,
      category,
      extension,
    };

    const newDocument = new this.documentModel({
      ...createDocumentDTO,
      fileRegister,
      documentationType: documentationTypeData,
      stateDocumentWorkflow: 'Espera Envio',
      userId: userId,
    });

    //---------- template -----------------
    //---DOWNLOAD TEMPLATE FROM TYPE DOCUMENT ------
    const idTemplateFromDoc = newDocument.documentationType.idTemplateDocType;
    const getBase64Template = await this.httpService
      .get(`${this.apiFilesUploader}/file/template/${idTemplateFromDoc}`)
      .toPromise();
    const base64TemplateDoc = getBase64Template.data.file.base64;
    //--decodificar base64 a dats binarios
    const binaryData = Buffer.from(base64TemplateDoc, 'base64');
    //--especificar ruta y nombre del archivo temporal
    const path = require('path');
    const tempFolder = path.join(process.cwd(), 'template');
    const fileName = `${newDocument.documentationType.typeName}_template.docx`;
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

    //--------------------------------------------

    const rutaTemplate = path.join(
      process.cwd(),
      'template',
      `${newDocument.documentationType.typeName}_template.docx`,
    );
    const templatefile = fs.readFileSync(rutaTemplate);

    const data = {
      numberDocumentTag: newDocument.numberDocument,
      title: newDocument.title,
      descriptionTag: newDocument.description,
    };

    const handler = new TemplateHandler();
    const doc = await handler.process(templatefile, data);
    const fileNameDoc = `${newDocument.documentationType.typeName}_${newDocument.numberDocument}.docx`;

    const templateDirectorySave = path.join(process.cwd(), 'template');
    const filePathDoc = path.join(templateDirectorySave, fileNameDoc);

    fs.writeFileSync(filePathDoc, doc);

    const rutaDocGenerated = path.join(
      process.cwd(),
      'template',
      `${newDocument.documentationType.typeName}_${newDocument.numberDocument}.docx`,
    );
    const resultFile = fs.readFileSync(rutaDocGenerated);
    const base64String = resultFile.toString('base64');
    const fileExtension = path
      .extname(
        `${newDocument.documentationType.typeName}_${newDocument.numberDocument}.docx`,
      )
      .substring(1);
    const mimeTypeDoc = `application/${fileExtension}`;

    const dataDocx = {
      mime: mimeTypeDoc,
      base64: base64String,
    };

    const sentDataDocx = await this.httpService
      .post(`${this.apiFilesTemplate}/files/upload-template-docx`, {
        templateName: fileNameDoc,
        file: dataDocx,
      })
      .toPromise();

    const timeToLiveInMIlliseconds = 1 * 60 * 1000;

    setTimeout(() => {
      fs.unlink(filePathDoc, (err) => {
        if (err) {
          console.error('error al eliminar archivo temporal: ', err);
        } else {
          console.log('Archivo temporal eliminado: ', filePathDoc);
        }
      });
    }, timeToLiveInMIlliseconds);
    console.log('datos recividos del servicio file enviado de template');
    console.log(sentDataDocx.data.file._id);
    newDocument.idTemplate = sentDataDocx.data.file._id;
    //-----------------------------------------------------
    return newDocument.save();
  }

  private async createDocumentWithoutFile(
    createDocumentDTO: CreateDocumentDTO,
    documentationTypeData: DocumentationType,
    userId,
  ): Promise<Documents> {
    const newDocument = new this.documentModel({
      ...createDocumentDTO,
      documentationType: documentationTypeData,
      stateDocumentWorkflow: 'Espera Envio',
      userId: userId,
    });

    //---------- template -----------------
    //---DOWNLOAD TEMPLATE FROM TYPE DOCUMENT ------
    const idTemplateFromDoc = newDocument.documentationType.idTemplateDocType;
    const getBase64Template = await this.httpService
      .get(`${this.apiFilesTemplate}/file/template/${idTemplateFromDoc}`)
      .toPromise();
    const base64TemplateDoc = getBase64Template.data.file.base64;
    //--decodificar base64 a dats binarios
    const binaryData = Buffer.from(base64TemplateDoc, 'base64');
    //--especificar ruta y nombre del archivo temporal
    const path = require('path');
    const tempFolder = path.join(process.cwd(), 'template');
    const fileName = `${newDocument.documentationType.typeName}_template.docx`;
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
    //------------------------------------------------

    const rutaTemplate = path.join(
      process.cwd(),
      'template',
      `${newDocument.documentationType.typeName}_template.docx`,
    );
    const templatefile = fs.readFileSync(rutaTemplate);

    const data = {
      numberDocumentTag: newDocument.numberDocument,
      title: newDocument.title,
      descriptionTag: newDocument.description,
    };

    const handler = new TemplateHandler();
    const doc = await handler.process(templatefile, data);
    const fileNameDoc = `${newDocument.documentationType.typeName}_${newDocument.numberDocument}.docx`;

    const templateDirectorySave = path.join(process.cwd(), 'template');
    const filePathDoc = path.join(templateDirectorySave, fileNameDoc);

    fs.writeFileSync(filePathDoc, doc);

    const rutaDocGenerated = path.join(
      process.cwd(),
      'template',
      `${newDocument.documentationType.typeName}_${newDocument.numberDocument}.docx`,
    );
    const resultFile = fs.readFileSync(rutaDocGenerated);
    const base64String = resultFile.toString('base64');
    const fileExtension = path
      .extname(
        `${newDocument.documentationType.typeName}_${newDocument.numberDocument}.docx`,
      )
      .substring(1);
    const mimeTypeDoc = `application/${fileExtension}`;

    const dataDocx = {
      mime: mimeTypeDoc,
      base64: base64String,
    };

    const sentDataDocx = await this.httpService
      .post(`${process.env.API_FILES_TEMPLATE}/files/upload-template-docx`, {
        templateName: fileNameDoc,
        file: dataDocx,
      })
      .toPromise();
    const timeToLiveInMIlliseconds = 1 * 60 * 1000;

    setTimeout(() => {
      fs.unlink(filePathDoc, (err) => {
        if (err) {
          console.error('error al eliminar archivo temporal: ', err);
        } else {
          console.log('Archivo temporal eliminado: ', filePathDoc);
        }
      });
    }, timeToLiveInMIlliseconds);
    newDocument.idTemplate = sentDataDocx.data.file._id;
    //---------------------------------------------------------

    return newDocument.save();
  }

  //---------------------------------- update -------------------------
  async update(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
  ): Promise<Documents> {
    const findDocument = await this.documentModel.findById(id).exec();
    if (!findDocument) {
      throw new NotFoundException(`documento con id: ${id} no existe`);
    }
    if (!findDocument.active) {
      throw new HttpException(`Documento con id: ${id} fue borrado`, 404);
    }
    const { documentTypeName, description, title } = updateDocumentDTO;
    if (description !== undefined && description !== '') {
      findDocument.description = description;

      if (title !== undefined && title !== '') {
        findDocument.title = title;
      }

      const documentationType = await this.documentationTypeModel.findOne({
        typeName: documentTypeName,
      });

      if (documentTypeName !== undefined && documentTypeName !== '') {
        findDocument.documentationType = documentationType;
      }
      if (updateDocumentDTO.file && updateDocumentDTO.file.startsWith('data')) {
        return this.updateDocumentWithFile(
          id,
          updateDocumentDTO,
          findDocument,
          documentationType,
        );
      } else {
        return this.updateDocumentWithoutFile(
          id,
          updateDocumentDTO,
          findDocument,
          documentationType,
        );
      }
    }
  }

  private async updateDocumentWithFile(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
    findDocument: Documents,
    documentationType: DocumentationType,
  ): Promise<Documents> {
    try {
      const fileObj = this.extractFileData(updateDocumentDTO.file);
      const response = await this.uploadFile(fileObj);

      const fileRegister = this.createFileRegister(response.data.file);

      return await this.updateDocument(
        id,
        updateDocumentDTO,
        fileRegister,
        documentationType,
      );
    } catch (error) {
      throw new Error('no se pudo cargar el archivo');
    }
  }

  private async updateDocumentWithoutFile(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
    findDocument: Documents,
    documentationType: DocumentationType,
  ): Promise<Documents> {
    return this.updateDocument(
      id,
      updateDocumentDTO,
      findDocument.fileRegister,
      findDocument.documentationType,
    );
  }

  private async updateDocument(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
    fileRegister: any,
    documentationType: DocumentationType,
  ): Promise<any> {
    const updateDocument = {
      ...updateDocumentDTO,
      fileRegister,
      documentationType,
    };
    const updateNewDocument = await this.documentModel
      .findOneAndUpdate({ _id: id }, updateDocument, { new: true })
      .exec();

    //---------- template -----------------
    //---DOWNLOAD TEMPLATE FROM TYPE DOCUMENT ------
    const idTemplateFromDoc =
      updateNewDocument.documentationType.idTemplateDocType;
    const getBase64Template = await this.httpService
      .get(
        `${process.env.API_FILES_TEMPLATE}/file/template/${idTemplateFromDoc}`,
      )
      .toPromise();
    const base64TemplateDoc = getBase64Template.data.file.base64;
    //--decodificar base64 a dats binarios
    const binaryData = Buffer.from(base64TemplateDoc, 'base64');
    //--especificar ruta y nombre del archivo temporal
    const path = require('path');
    const tempFolder = path.join(process.cwd(), 'template');
    const fileName = `${updateNewDocument.documentationType.typeName}_template.docx`;
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
    //------------------------------------------

    const rutaTemplate = path.join(
      process.cwd(),
      'template',
      `${updateNewDocument.documentationType.typeName}_template.docx`,
    );
    const templatefile = fs.readFileSync(rutaTemplate);

    const data = {
      numberDocumentTag: updateNewDocument.numberDocument,
      title: updateNewDocument.title,
      descriptionTag: updateNewDocument.description,
    };

    const handler = new TemplateHandler();
    const doc = await handler.process(templatefile, data);
    const fileNameDoc = `${updateNewDocument.documentationType.typeName}_${updateNewDocument.numberDocument}.docx`;

    const templateDirectorySave = path.join(process.cwd(), 'template');
    const filePathDoc = path.join(templateDirectorySave, fileNameDoc);

    fs.writeFileSync(filePathDoc, doc);
    const timeToLiveInMIlliseconds = 1 * 60 * 1000;

    setTimeout(() => {
      fs.unlink(filePathDoc, (err) => {
        if (err) {
          console.error('error al eliminar archivo temporal: ', err);
        } else {
          console.log('Archivo temporal eliminado: ', filePathDoc);
        }
      });
    }, timeToLiveInMIlliseconds);
    const rutaDocGenerated = path.join(
      process.cwd(),
      'template',
      `${updateNewDocument.documentationType.typeName}_${updateNewDocument.numberDocument}.docx`,
    );
    const resultFile = fs.readFileSync(rutaDocGenerated);
    const base64String = resultFile.toString('base64');
    const fileExtension = path
      .extname(
        `${updateNewDocument.documentationType.typeName}_${updateNewDocument.numberDocument}.docx`,
      )
      .substring(1);
    const mimeTypeDoc = `application/${fileExtension}`;

    const dataDocx = {
      mime: mimeTypeDoc,
      base64: base64String,
    };

    const sentDataDocx = await this.httpService
      .post(`${process.env.API_FILES_TEMPLATE}/files/upload-template-docx`, {
        templateName: fileNameDoc,
        file: dataDocx,
      })
      .toPromise();
    console.log('datos recividos del servicio file enviado de template');
    console.log(sentDataDocx.data.file._id);
    updateNewDocument.idTemplate = sentDataDocx.data.file._id;
    //---------------------------------------------------------

    const {
      _id,
      numberDocument,
      title,
      description,
      active,
      createdAt,
      updateAt,
      state,
      idTemplate,
    } = updateNewDocument;

    const showNewDocumet = {
      _id,
      numberDocument,
      title,
      documentationType: updateNewDocument.documentationType.typeName,
      description,
      fileRegister: updateNewDocument.fileRegister,
      active,
      createdAt,
      updateAt,
      state,
      idTemplate,
    };

    return showNewDocumet;
  }

  private extractFileData(file: string): { mime: string; base64: string } {
    const mimeType = file.split(';')[0].split(':')[1];
    const base64 = file.split(',')[1];
    return { mime: mimeType, base64 };
  }

  private async uploadFile(fileObj: {
    mime: string;
    base64: string;
  }): Promise<any> {
    return this.httpService
      .post(`${this.apiFilesUploader}/files/upload`, { file: fileObj })
      .toPromise();
  }

  private createFileRegister(fileData: any): any {
    const {
      _id,
      filename,
      size,
      filePath,
      status,
      category,
      extension,
      base64,
    } = fileData;
    return {
      _idFile: _id,
      filename,
      size,
      filePath,
      status,
      category,
      extension,
    };
  }

  async enviarDocument(
    documentId: string,
    addWorkflowDocumentDto: AddWorkflowDocumentDto,
    userId: string,
  ): Promise<Documents> {
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException(
        `Documento con ID "${documentId}" no encontrado`,
      );
    }
    if (document.active === false) {
      throw new HttpException(
        `documento con id: ${documentId} fue eliminado`,
        404,
      );
    }
    const { worflowName, ci } = addWorkflowDocumentDto;

    if (!ci) {
      throw new HttpException('no se encontro ci', 400);
    }

    const uniqueCi = new Set(ci);
    if (uniqueCi.size !== ci.length) {
      throw new HttpException(
        'Hay numeros de identificacion CI duplicados',
        400,
      );
    }

    const workflowData = await this.findWorkflowByName(worflowName);

    const workDt = {
      nombre: workflowData.nombre,
      descriptionWorkflow: workflowData.descriptionWorkflow,
      steps: workflowData.steps,
      pasoActual: workflowData.pasoActual,
      createdAt: workflowData.createdAt,
      activeWorkflow: workflowData.activeWorkflow,
      oficinaActual: workflowData.oficinaActual,
      updateAt: workflowData.updateAt,
    };

    if (!workflowData) {
      throw new HttpException('no se encontro nombre del workflow', 404);
    }

    document.workflow = workDt;

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.steps[0][0].pasos;
    if (pasoActual < pasos.length) {
      const unityUserPromises = ci.map(async (ci) => {
        const user = await this.httpService
          .get(`${process.env.API_PERSONAL_GET_CI}/${ci}`)
          .toPromise();
        if (user.data._id === userId) {
          throw new HttpException('No se puede enviar archivo a si mismo', 400);
        }
        if (!user.data) {
          throw new HttpException(`Usuario con CI: ${ci} no encontrado`, 404);
        }
        const unityUser = user.data.unity;
        const dataOficeUser = await this.httpService
          .get(
            `${
              process.env.API_ORGANIZATION_CHART_MAIN
            }?name=${encodeURIComponent(unityUser)}`,
          )
          .toPromise();
        const exacMatch = dataOficeUser.data.find(
          (result) => result.name === unityUser,
        );
        const idOfficeUser = exacMatch._id;
        if (pasos[pasoActual].idOffice !== idOfficeUser) {
          throw new HttpException(
            `Usuario con CI: ${ci} no trabaja en la oficina a enviar`,
            400,
          );
        }
        return {
          ci,
          idOfUser: user.data._id,
          idOfficeUser,
          unityUser,
        };
      });
      const unityUsers = await Promise.all(unityUserPromises);
      pasos[pasoActual].completado = true;
      workflow.pasoActual = pasoActual + 1;
      workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;
      let newBitacora = [];
      const nameOfTheOffice = await this.httpService
        .get(
          `${process.env.API_ORGANIZATION_CHART_ID}/${pasos[pasoActual].idOffice}`,
        )
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;
      newBitacora.push({
        oficinaActual: pasos[pasoActual].idOffice,
        nameOficinaActual: nameOffce,
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
          nameOfficeUserRecieved: user.unityUser,
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos,
      });

      document.workflow = workflow;
      document.stateDocumentWorkflow = 'Proceso Envio';
      document.bitacoraWorkflow = newBitacora;
      await document.save();
      return document;
    } else {
      document.stateDocumentWorkflow = 'finalizado';
      throw new HttpException('todos los pasos fueron completados', 400);
    }
  }

  async sendDocumentToUnity(
    documentId: string,
    addWorkflowSinCiDocumentDto: AddWorkflowSinCiDocumentDto,
    userId: string,
  ): Promise<Documents> {
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException(
        `Documento con ID "${documentId}" no encontrado`,
      );
    }
    if (document.active === false) {
      throw new HttpException(
        `documento con id: ${documentId} fue eliminado`,
        404,
      );
    }

    const { workflowName } = addWorkflowSinCiDocumentDto;

    const workflowData = await this.findWorkflowByName(workflowName);
    if (!workflowData) {
      throw new HttpException('no se encontro el workflow', 400);
    }
    const {
      descriptionWorkflow,
      steps,
      createdAt,
      activeWorkflow,
      oficinaActual,
      updateAt,
    } = workflowData;

    const workDt: Workflow = {
      nombre: workflowData.nombre,
      descriptionWorkflow,
      steps,
      pasoActual: workflowData.pasoActual,
      createdAt,
      activeWorkflow,
      oficinaActual,
      updateAt,
    };

    document.workflow = workDt;

    //---------paso actual del documento ---
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.steps[0][0].pasos;

    //------- obtener lista con todos los usuarios ---
    //---- obtener info de la persona logeada y evitar su registro si trabja en
    //---- misma oficina
    const loggedUser = await this.httpService
      .get(`${process.env.API_PERSONAL_GET}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;
    const loggedUserOffice = await this.httpService
      .get(
        `${process.env.API_ORGANIZATION_CHART_MAIN}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const exacMatch = loggedUserOffice.data.find(
      (result) => result.name === userOficce,
    );

    const personalList = await this.httpService
      .get(`${process.env.API_PERSONAL_GET}`)
      .toPromise();

    const personalListData = personalList.data;
    const unitysPersonalAll = personalListData.map((user) => ({
      unity: user.unity,
      ci: user.ci,
      idOfUser: user._id,
    }));

    // Filtrar la lista de usuarios de la oficina actual para excluir al usuario logueado
    const filteredUnitysPersonal = unitysPersonalAll.filter(
      (user) => user.ci !== loggedUser.data.ci,
    );

    const obtainDatos = await Promise.all(
      filteredUnitysPersonal.map(async (idOfice) => ({
        info: await this.httpService
          .get(
            `${
              process.env.API_ORGANIZATION_CHART_MAIN
            }?name=${encodeURIComponent(idOfice.unity)}`,
          )
          .toPromise(),
        idOfUser: idOfice.idOfUser,
        ci: idOfice.ci,
      })),
    );
    console.log('esto es obtainDatos');
    console.log(obtainDatos.map((data) => data.ci));

    if (pasoActual < pasos.length) {
      const reeeee = obtainDatos.map((response) => ({
        nameUnity: response.info.data[0].name,
        idOficce: response.info.data[0]._id,
        idOfUser: response.idOfUser,
        ci: response.ci,
      }));

      const matchingUsers = reeeee.filter(
        (datata) => datata.idOficce === pasos[pasoActual].idOffice,
      );
      // const matchingUsers = filteredUnitysPersonal.filter(
      //   (datata) => datata.idOficce === pasos[pasoActual].idOffice,
      // );
      console.log('esto es matchingUsers');
      console.log(matchingUsers);

      const receivedUsers = matchingUsers.map((data) => ({
        ciUser: data.ci,
        idOfUser: data.idOfUser,
        nameOfficeUserRecieved: data.nameUnity,
      }));

      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;
        const nameOfTheOffice = await this.httpService
          .get(
            `${process.env.API_ORGANIZATION_CHART_ID}/${pasos[pasoActual].idOffice}`,
          )
          .toPromise();
        const nameOffce = nameOfTheOffice.data.name;

        let newBitacora = [];
        newBitacora.push({
          oficinaActual: pasos[pasoActual].idOffice,
          nameOficinaActual: nameOffce,
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos,
        });

        document.workflow = workflow;
        document.stateDocumentWorkflow = 'Proceso Envio';
        document.bitacoraWorkflow = newBitacora;
      }
      await document.save();
      return document;
    } else {
      document.stateDocumentWorkflow = 'Finalizado';
      throw new HttpException('se llego la paso final', 400);
    }
  }

  async findWorkflowByName(workflowName: string): Promise<Workflow> {
    const workflowData = await this.workflowModel
      .findOne({ nombre: workflowName })
      .exec();
    return workflowData;
  }

  //-----------------------------------------------------------------

  async derivarDocumentAll(
    documentId: string,
    userId: string,
  ): Promise<Documents> {
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException(
        `Documento con ID "${documentId}" no encontrado`,
      );
    }
    if (document.active === false) {
      throw new HttpException(
        `documento con id: ${documentId} fue eliminado`,
        404,
      );
    }
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.steps[0][0].pasos;

    //------- obtener lista con todos los usuarios ---
    //---------
    const loggedUser = await this.httpService
      .get(`${process.env.API_PERSONAL_GET}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;
    const loggedUserOffice = await this.httpService
      .get(
        `${process.env.API_ORGANIZATION_CHART_MAIN}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();

    const personalList = await this.httpService
      .get(`${process.env.API_PERSONAL_GET}`)
      .toPromise();

    const personalListData = personalList.data;
    const unitysPersonalAll = personalListData.map((user) => ({
      unity: user.unity,
      ci: user.ci,
      idOfUser: user._id,
    }));

    const filteredUnitysPersonal = unitysPersonalAll.filter(
      (user) => user.ci !== loggedUser.data.ci,
    );

    const obtainDatos = await Promise.all(
      filteredUnitysPersonal.map(async (idOfice) => ({
        info: await this.httpService
          .get(
            `${
              process.env.API_ORGANIZATION_CHART_MAIN
            }?name=${encodeURIComponent(idOfice.unity)}`,
          )
          .toPromise(),
        idOfUser: idOfice.idOfUser,
        ci: idOfice.ci,
      })),
    );

    if (pasoActual < pasos.length) {
      const reeeee = obtainDatos.map((response) => ({
        nameUnity: response.info.data[0].name,
        idOficce: response.info.data[0]._id,
        idOfUser: response.idOfUser,
        ci: response.ci,
      }));

      const matchingUsers = reeeee.filter(
        (datata) => datata.idOficce === pasos[pasoActual].idOffice,
      );

      const receivedUsers = matchingUsers.map((data) => ({
        ciUser: data.ci,
        idOfUser: data.idOfUser,
        nameOfficeUserRecieved: data.nameUnity,
      }));

      const receivedUsersArray = [];

      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;

        const nameOfTheOffice = await this.httpService
          .get(
            `${process.env.API_ORGANIZATION_CHART_ID}/${pasos[pasoActual].idOffice}`,
          )
          .toPromise();
        const nameOffce = nameOfTheOffice.data.name;

        document.bitacoraWorkflow.push({
          oficinaActual: pasos[pasoActual].idOffice,
          nameOficinaActual: nameOffce,
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos,
        });

        document.workflow = workflow;
      }
      await document.save();
      return document;
    } else {
      document.stateDocumentWorkflow = 'Finalizado';
      throw new HttpException('se llego la paso final', 400);
    }
  }

  async derivarDocumentWithCi(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException(
        `Documento con ID "${documentId}" no encontrado`,
      );
    }
    if (document.active === false) {
      throw new HttpException(
        `documento con id: ${documentId} fue eliminado`,
        404,
      );
    }

    const uniqueCi = new Set(ci);
    if (uniqueCi.size !== ci.length) {
      throw new HttpException(
        'Hay numeros de identificacion CI duplicados',
        400,
      );
    }

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.steps[0][0].pasos;
    if (pasoActual < pasos.length) {
      const unityUserPromises = ci.map(async (ci) => {
        const user = await this.httpService
          .get(`${process.env.API_PERSONAL_GET_CI}/${ci}`)
          .toPromise();
        if (user.data._id === userId) {
          throw new HttpException('No se puede enviar archivo a si mismo', 400);
        }
        if (!user.data) {
          throw new HttpException(`Usuario con CI: ${ci} no encontrado`, 404);
        }
        const unityUser = user.data.unity;
        const dataOficeUser = await this.httpService
          .get(
            `${
              process.env.API_ORGANIZATION_CHART_MAIN
            }?name=${encodeURIComponent(unityUser)}`,
          )
          .toPromise();
        const exacMatch = dataOficeUser.data.find(
          (result) => result.name === unityUser,
        );

        const idOfficeUser = exacMatch._id;
        if (pasos[pasoActual].idOffice !== idOfficeUser) {
          throw new HttpException(
            `Usuario con CI: ${ci} no trabaja en la oficina a enviar`,
            400,
          );
        }
        return {
          ci,
          idOfUser: user.data._id,
          idOfficeUser,
          unityUser,
        };
      });
      const unityUsers = await Promise.all(unityUserPromises);
      pasos[pasoActual].completado = true;
      workflow.pasoActual = pasoActual + 1;
      workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;

      const nameOfTheOffice = await this.httpService
        .get(
          `${process.env.API_ORGANIZATION_CHART_ID}/${pasos[pasoActual].idOffice}`,
        )
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;
      // console.log(nameOffce);

      document.bitacoraWorkflow.push({
        oficinaActual: pasos[pasoActual].idOffice,
        nameOficinaActual: nameOffce,
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
          nameOfficeUserRecieved: user.unityUser,
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos,
      });

      document.workflow = workflow;
      await document.save();
      return document;
    } else {
      document.stateDocumentWorkflow = 'Finalizado';
      throw new HttpException('todos los pasos fueron completados', 400);
    }
  }

  //----------------------------------------

  async sendDocumentSinWorkflow(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException(
        `Documento con ID "${documentId}" no encontrado`,
      );
    }
    if (document.active === false) {
      throw new HttpException(
        `documento con id: ${documentId} fue eliminado`,
        404,
      );
    }

    if (document.workflow) {
      throw new HttpException(
        'este documento cuenta con un flujo de trabajo',
        400,
      );
    }

    const uniqueCi = new Set(ci);
    if (uniqueCi.size !== ci.length) {
      throw new HttpException(
        'Hay numeros de identificacion CI duplicados',
        400,
      );
    }

    const loggedUser = await this.httpService
      .get(`${process.env.API_PERSONAL_GET}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;
    const loggedUserOffice = await this.httpService
      .get(
        `${process.env.API_ORGANIZATION_CHART_MAIN}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const exacMatch = loggedUserOffice.data.find(
      (result) => result.name === userOficce,
    );

    const unityUserPromises = ci.map(async (ci) => {
      const user = await this.httpService
        .get(`${process.env.API_PERSONAL_GET_CI}/${ci}`)
        .toPromise();
      if (user.data._id === userId) {
        throw new HttpException(
          'No se puede enviar un documento a si mismo',
          400,
        );
      }
      if (!user.data) {
        throw new HttpException(`Usuario con CI: ${ci} no encontrado`, 404);
      }

      const unityUser = user.data.unity;
      const dataOficeUser = await this.httpService
        .get(
          `${process.env.API_ORGANIZATION_CHART_MAIN}?name=${encodeURIComponent(
            unityUser,
          )}`,
        )
        .toPromise();
      const exacMatchToUsers = loggedUserOffice.data.find(
        (result) => result.name === userOficce,
      );
      const idOfficeUser = exacMatchToUsers._id;
      return {
        ci,
        idOfUser: user.data._id,
        idOfficeUser,
        unityUser,
      };
    });

    const unityUsers = await Promise.all(unityUserPromises);

    let infoIdUsers = document.bitacoraWithoutWorkflow.map((data) =>
      data.recievedUsers.map((data) => data.idOfUser),
    );

    const idUsersToSend = unityUsers.map((data) => data.idOfUser);
    // for (const row of infoIdUsers) {
    //   for (const item of row) {
    //     if (idUsersToSend.map((data) => data === item)) {
    //       console.log('hay repetido');
    //       throw new HttpException('documento ya enviado a usuario', 400);
    //     }
    //   }
    // }

    document.bitacoraWithoutWorkflow.push({
      idUserSendOrigin: userId,
      idOfficeUserSend: exacMatch._id,
      nameOficeUser: userOficce,
      recievedUsers: unityUsers.map((user) => ({
        ciUser: user.ci,
        idOfUser: user.idOfUser,
        idOffice: user.idOfficeUser,
        nameOficeUserRecieved: user.unityUser,
      })),
    });
    document.stateDocumentWorkflow = 'enviado';
    await document.save();
    return document;
  }

  //-----------------------------------

  async showRecievedDocumentWithouWorkflow(
    idUser: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true, workflow: null })
      .exec();
    const userLogged = idUser;
    let filteredDocuments = [];
    for (const document of documents) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();

          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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
      const filteredDocumentsSome = document.bitacoraWithoutWorkflow.some(
        (bitacoraEntry) => {
          return bitacoraEntry.recievedUsers.some(
            (user) => user.idOfUser === userLogged,
          );
        },
      );
      if (filteredDocumentsSome) {
        document.stateDocumentWorkflow = 'recibido';
        filteredDocuments.push(document);
      }
    }
    return filteredDocuments;
  }

  //------------------------------------------------------------------------

  async showRecievedDocument(idUser: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    const filteredDocumentsWithSteps = [];
    for (const document of documents) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();

          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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

      const idUserLogged = idUser;

      const bitacoraEntries = document.bitacoraWorkflow;
      const userIdsAndOffices = bitacoraEntries.map((entry) => ({
        userId: entry.receivedUsers.map((dat) => dat.idOfUser),
        office: entry.oficinaActual,
      }));
      // console.log('esto es userIdsAndOffices');
      // console.log(userIdsAndOffices);

      const filteredResult = userIdsAndOffices.filter((entry) =>
        entry.userId.map((dat) => dat === idUser),
      );
      // console.log('esto es filteredRestul');
      // console.log(filteredResult);

      const matchingEntry = document.bitacoraWorkflow.find((entry) =>
        filteredResult.some((result) =>
          entry.receivedUsers.some((user) =>
            result.userId.map((dat) => dat === user.idOfUser),
          ),
        ),
      );

      // console.log('esto es matchingEntry');
      // console.log(matchingEntry);

      if (matchingEntry) {
        if (document.workflow) {
          const usersInBitacora = matchingEntry.receivedUsers.map(
            (user) => user.idOfUser,
          );
          if (usersInBitacora.includes(idUser)) {
            const matchingStep = document.workflow.steps[0][0].pasos.find(
              (paso) => paso.idOffice === matchingEntry.oficinaActual,
            );
            // console.log('esto es marchingStep');
            // console.log(matchingStep);
            if (matchingStep) {
              const nextStepIndex =
                document.workflow.steps[0][0].pasos.findIndex(
                  (paso) => paso === matchingStep,
                );
              // console.log('esto es nextStepINdex');
              // console.log(nextStepIndex);
              if (
                nextStepIndex <
                document.workflow.steps[0][0].pasos.length - 1
              ) {
                const nextStep =
                  document.workflow.steps[0][0].pasos[nextStepIndex + 1];
                const stateSend = nextStep.completado ? 'enviado' : 'recibido';
                document.stateDocumentWorkflow = stateSend;
                filteredDocumentsWithSteps.push({
                  document,
                });
              } else {
                (document.stateDocumentWorkflow = 'COMPLETADO'),
                  filteredDocumentsWithSteps.push({
                    document,
                  });
              }
            }
          }
        }
      }
    }
    return filteredDocumentsWithSteps.map((dat) => dat.document);
  }

  async showAllDocumentSend(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ userId: userId, stateDocumentWorkflow: 'PROCESO ENVIO' })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();

    for (const document of documents) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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

  //-----------------------
  async showAllDocumentsSendWithoutWorkflow(
    userId: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({
        workflow: null,
        stateDocumentWorkflow: 'ENVIADO',
        userId: userId,
        active: true,
      })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();

    const filteredDocuments = [];

    for (const document of documents) {
      // const matchingEntry = document.bitacoraWithoutWorkflow.filter((entry) =>
      //   entry.recievedUsers.some((user) => user.idOfUser === userId),
      // );

      // if (matchingEntry.length > 0) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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

      filteredDocuments.push(document);
      // }
    }
    return filteredDocuments;
  }

  //---------------------------------

  async getDocumentsOnHold(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({
        active: true,
        bitacoraWorkflow: [],
        bitacoraWithoutWorkflow: [],
        stateDocumentWorkflow: 'ESPERA ENVIO',
        userId: userId,
      })
      .exec();
    for (const document of documents) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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

  //------------------------

  async selectPasoAnterior(
    documentId: string,
    numberPaso: number,
    motivo: string,
  ): Promise<Documents> {
    const document = await this.documentModel.findById(documentId);

    if (!document) {
      throw new NotFoundException(
        `Documento con ID "${documentId}" no encontrado`,
      );
    }

    const workflow = document.workflow;
    // const pasoActual = workflow.pasoActual;
    const pasos = workflow.steps[0][0].pasos;

    if (numberPaso <= 0 || numberPaso > pasos.length) {
      throw new BadRequestException('El paso no existe');
    }

    const selectedPaso = pasos[numberPaso - 1];

    for (let i = numberPaso; i < pasos.length; i++) {
      pasos[i].completado = false;
    }

    workflow.pasoActual = numberPaso;
    workflow.oficinaActual = selectedPaso.idOffice;
    console.log(selectedPaso);

    const matchingEntry = document.bitacoraWorkflow.find(
      (entry) => entry.oficinaActual === selectedPaso.idOffice,
    );

    if (matchingEntry) {
      const receivedUsers = matchingEntry.receivedUsers;

      const nameOfTheOffice = await this.httpService
        .get(
          `${process.env.API_ORGANIZATION_CHART_ID}/${selectedPaso.idOffice}`,
        )
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;

      document.bitacoraWorkflow.push({
        oficinaActual: selectedPaso.idOffice,
        nameOficinaActual: nameOffce,
        receivedUsers,
        motivoBack: 'El motivo para volver atras fue: ' + motivo,
        oficinasPorPasar: pasos,
      });
    }
    document.workflow = workflow;
    document.stateDocumentWorkflow = 'Proceso Envio';
    await document.save();
    return document;
  }

  //--------------------------------------------------

  async filterParams(filter: DocumentsFilter): Promise<Documents[]> {
    const query = {};

    if (filter.numberDocument) {
      query['numberDocument'] = filter.numberDocument;
    }

    if (filter.title) {
      query['title'] = filter.title;
    }

    if (filter.typeName) {
      query['documentationType.typeName'] = filter.typeName;
    }

    if (filter.stateDocument) {
      query['stateDocument'] = filter.stateDocument;
    }

    if (filter.nombre) {
      query['workflow.nombre'] = filter.nombre;
    }

    if (filter.description) {
      query['description'] = filter.description;
    }

    const filteredDocuments = await this.documentModel
      .find(query)
      .sort({ numberDocument: 1 })
      .exec();

    for (const document of filteredDocuments) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
          // throw new HttpException('no se encontro base64 del archivo', 404);
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {}
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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
    for (const document of documents) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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

  async findDocumentsActive(query: any): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    for (const document of documents) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        console.log(fileRegisterObject._idFile);
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          console.log('esto es base64 del servidor');
          console.log(res.data.file.base64);
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
          // throw new HttpException('no se encontro base64 del archivo', 404);
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        console.log(fileRegisterObject._idFile);
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          console.log('esto es base64 del servidor');
          console.log(res.data.file.base64);
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          document.fileBase64 = null;
          // throw new HttpException('no se encontro base64 del archivo', 404);
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            // 'data:' + res.data.file.mime + ';base64,' +
            res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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

  async findAllPaginate(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;
    const documents = await this.documentModel
      .find({ active: true })
      .limit(limit)
      .skip(offset);
    for (const document of documents) {
      if (document.fileRegister && typeof document.fileRegister === 'object') {
        // const idFile = document.fileRegister._idFile;
        const fileRegisterObject = document.fileRegister as unknown as {
          _idFile: string;
        };
        console.log(fileRegisterObject._idFile);
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
            )
            .toPromise();
          document.fileBase64 =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro base64 del archivo', 404);
        }
      }
      if (document.idTemplate) {
        try {
          const res = await this.httpService
            .get(
              `${process.env.API_FILES_UPLOADER}/file/${document.idTemplate}`,
            )
            .toPromise();
          document.base64Template =
            'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
        } catch (error) {
          throw new HttpException('no se encontro datos', 404);
        }
      }
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${process.env.API_PERSONAL_GET}/${document.userId}`)
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

  async findOne(id: string): Promise<Documents> {
    const documents = await this.documentModel.findOne({ _id: id }).exec();
    if (documents.active === false) {
      throw new HttpException(`documento con id: ${id} fue eliminado`, 404);
    }
    // for(const document of documents){
    if (documents.fileRegister && typeof documents.fileRegister === 'object') {
      // const idFile = document.fileRegister._idFile;
      const fileRegisterObject = documents.fileRegister as unknown as {
        _idFile: string;
      };
      // console.log(fileRegisterObject._idFile);
      try {
        const res = await this.httpService
          .get(
            `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
          )
          .toPromise();
        documents.fileBase64 =
          'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro base64 del archivo', 404);
      }
    }
    if (documents.idTemplate) {
      try {
        const res = await this.httpService
          .get(`${process.env.API_FILES_UPLOADER}/file/${documents.idTemplate}`)
          .toPromise();
        documents.base64Template = res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro datos', 404);
      }
    }
    if (documents.userId) {
      try {
        const res = await this.httpService
          .get(`${process.env.API_PERSONAL_GET}/${documents.userId}`)
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
    // }
    return documents;
  }

  async getDocumentByUserId(userId: string): Promise<Documents[]> {
    const documents = this.documentModel.find({ userId: userId }).exec();
    return documents;
  }

  async getDocumentVersion(id: string, version: number): Promise<Documents> {
    const documents = await this.documentModel
      .findOne({ _id: id })
      .select('__v')
      .lean()
      .exec();
    // for(const document of documents){
    if (documents.fileRegister && typeof documents.fileRegister === 'object') {
      // const idFile = document.fileRegister._idFile;
      const fileRegisterObject = documents.fileRegister as unknown as {
        _idFile: string;
      };
      console.log(fileRegisterObject._idFile);
      try {
        const res = await this.httpService
          .get(
            `${process.env.API_FILES_UPLOADER}/file/${fileRegisterObject._idFile}`,
          )
          .toPromise();
        documents.fileBase64 =
          'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro base64 del archivo', 404);
      }
    }
    if (documents.idTemplate) {
      try {
        const res = await this.httpService
          .get(`${process.env.API_FILES_UPLOADER}/file/${documents.idTemplate}`)
          .toPromise();
        documents.base64Template =
          'data:' + res.data.file.mime + ';base64,' + res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro datos', 404);
      }
    }
    if (documents.userId) {
      try {
        const res = await this.httpService
          .get(`${process.env.API_PERSONAL_GET}/${documents.userId}`)
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
    document.active = false;
    await document.save();
    return document;
  }

  async activerDocument(id: string, active: boolean) {
    const document: DocumentDocument = await this.documentModel.findById(id);
    if (document.active === true) {
      throw new HttpException('el documento ya esta activo', 400);
    }
    document.active = true;

    await document.save();
    return document;
  }

  async addDocumentationType(typeName: string): Promise<any> {
    const documentationType =
      await this.documentationTypeService.getDocumentatioTypeByName(typeName);
    return documentationType;
  }

  fetchAdditionalData(id: string): Observable<any> {
    const url = `${process.env.API_FILES_UPLOADER}/file/${id}`;
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

  async generatePDF(title: string, date: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const pdfDoc = new PDFDocument();
      const buffers: any[] = [];

      pdfDoc.on('data', buffers.push.bind(buffers));
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      pdfDoc.fontSize(12).text(`Title: ${title}`, 50, 50);
      pdfDoc.fontSize(12).text(`Date: ${date}`, 50, 70);
      pdfDoc.end();
    });
  }
}
