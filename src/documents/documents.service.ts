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

@Injectable()
export class DocumentsService {
  private defaultLimit: number;
  private readonly apiFilesUploader = process.env.API_FILES_UPLOADER;

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
      const file = createDocumentDTO.file;
      //--------------------------------------------------------------------------------------------------------
      const {
        title,
        documentTypeName,
        stateDocument,
        // workflowName,
        description,
      } = createDocumentDTO;
      // const workflowData = await this.workflowModel.findOne({
      //   nombre: workflowName,
      // });
      // if (!workflowData) {
      //   throw new HttpException('no se encontro nombre del workflow', 404);
      // }
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
          // userId,
        );
      } else {
        return this.createDocumentWithoutFile(
          createDocumentDTO,
          documentationTypeData,
          // workflowData,
          // userId,
        );
      }
    } catch (error) {
      throw new HttpException('algo salio mal', 400);
    }
  }

  private async createDocumentWithFile(
    createDocumentDTO: CreateDocumentDTO,
    documentationTypeData: DocumentationType,
    // workflowData: Workflow,
    // userId,
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
      // workflow: workflowData,
      // userId: userId,
    });

    //---------- template -----------------
    const docxFilePath = path.resolve(
      __dirname,
      '../../template/myDocumento.docx',
    );
    const templateFile = fs.readFileSync(docxFilePath);
    console.log(docxFilePath);
    const data = {
      title: newDocument.title,
      documentationTypeTag: newDocument.documentationType.typeName,
      descriptionTag: newDocument.description,
      numberDocumentTag: newDocument.numberDocument,
    };

    const handler = new TemplateHandler();
    const doc = await handler.process(templateFile, data);

    fs.writeFileSync('template.docx', doc);
    const resultFile = fs.readFileSync('template.docx');
    const base64String = resultFile.toString('base64');
    const dataDocx = {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      base64: base64String,
    };

    const sentDataDocx = await this.httpService
      .post(`${process.env.API_FILES_UPLOADER}/files/upload`, {
        file: dataDocx,
      })
      .toPromise();
    console.log('datos recividos del servicio file enviado de template');
    console.log(sentDataDocx.data.file._id);
    newDocument.idTemplate = sentDataDocx.data.file._id;

    return newDocument.save();
  }

  private async createDocumentWithoutFile(
    createDocumentDTO: CreateDocumentDTO,
    documentationTypeData: DocumentationType,
    // workflowData: Workflow,
    // userId,
  ): Promise<Documents> {
    const newDocument = new this.documentModel({
      ...createDocumentDTO,
      documentationType: documentationTypeData,
      // workflow: workflowData,
      // userId: userId,
    });

    //---------- template -----------------
    const docxFilePath = path.resolve(
      __dirname,
      '../../template/myDocumento.docx',
    );

    const templateFile = fs.readFileSync(docxFilePath);
    const data = {
      title: newDocument.title,
      documentationTypeTag: newDocument.documentationType.typeName,
      descriptionTag: newDocument.description,
      numberDocumentTag: newDocument.numberDocument,
    };

    const handler = new TemplateHandler();
    const doc = await handler.process(templateFile, data);

    fs.writeFileSync('template.docx', doc);
    const resultFile = fs.readFileSync('template.docx');
    const base64String = resultFile.toString('base64');
    const dataDocx = {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      base64: base64String,
    };

    const sentDataDocx = await this.httpService
      .post(`${process.env.API_FILES_UPLOADER}/files/upload`, {
        file: dataDocx,
      })
      .toPromise();
    console.log('datos recividos del servicio file enviado de template');
    console.log(sentDataDocx.data.file._id);
    newDocument.idTemplate = sentDataDocx.data.file._id;

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
    const {
      // workflowName,
      documentTypeName,
      description,
      stateDocument,
      title,
    } = updateDocumentDTO;
    if (description !== undefined && description !== '') {
      findDocument.description = description;
    }
    if (stateDocument !== undefined && stateDocument !== '') {
      findDocument.stateDocument = stateDocument;
    }
    if (title !== undefined && title !== '') {
      findDocument.title = title;
    }
    // const workflow = await this.workflowService.getWorkflowByName(updateDocumentDTO.workflowName)

    // const workflow = await this.workflowModel.findOne({ nombre: workflowName });

    const documentationType = await this.documentationTypeModel.findOne({
      typeName: documentTypeName,
    });

    // if (workflowName !== undefined && workflowName !== '') {
    //   findDocument.workflow = workflow;
    // }

    if (documentTypeName !== undefined && documentTypeName !== '') {
      findDocument.documentationType = documentationType;
    }
    if (updateDocumentDTO.file && updateDocumentDTO.file.startsWith('data')) {
      return this.updateDocumentWithFile(
        id,
        updateDocumentDTO,
        findDocument,
        // workflow,
        documentationType,
      );
    } else {
      return this.updateDocumentWithoutFile(
        id,
        updateDocumentDTO,
        findDocument,
        // workflow,
        documentationType,
      );
    }
  }

  private async updateDocumentWithFile(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
    findDocument: Documents,
    // workflow: Workflow,
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
        // workflow,
      );
    } catch (error) {
      throw new Error('no se pudo cargar el archivo');
    }
  }

  private async updateDocumentWithoutFile(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
    findDocument: Documents,
    // workflow: Workflow,
    documentationType: DocumentationType,
  ): Promise<Documents> {
    return this.updateDocument(
      id,
      updateDocumentDTO,
      findDocument.fileRegister,
      findDocument.documentationType,
      // findDocument.workflow,
    );
  }

  private async updateDocument(
    id: string,
    updateDocumentDTO: UpdateDocumentDTO,
    fileRegister: any,
    documentationType: DocumentationType,
    // workflow: Workflow,
  ): Promise<Documents> {
    const updateDocument = {
      ...updateDocumentDTO,
      fileRegister,
      documentationType,
      // workflow,
    };

    return this.documentModel
      .findOneAndUpdate({ _id: id }, updateDocument, { new: true })
      .exec();
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
  //------------------------------------------------------------------------------------

  //-----------------------------

  // async actualizarDocumentoConWorkflow(id: string, updateDocumentDTO: UpdateDocumentDTO, nuevoWorkflow: Workflow): Promise<Documents> {
  //   const findDocument = await this.documentModel.findById(id);
  //   if (!findDocument) {
  //     throw new NotFoundException('Documento no encontrado');
  //   }
  //   if (!findDocument.active) {
  //     throw new HttpException('Documento inactivo', 403);
  //   }

  //   if (updateDocumentDTO.file && updateDocumentDTO.file.startsWith('data')) {
  //     return this.actualizarDocumentoConArchivoYWorkflow(id, updateDocumentDTO, nuevoWorkflow, findDocument);
  //   } else {
  //     return this.actualizarDocumentoSinArchivoYWorkflow(id, updateDocumentDTO, nuevoWorkflow, findDocument);
  //   }
  // }

  // private async actualizarDocumentoConArchivoYWorkflow(id: string, updateDocumentDTO: UpdateDocumentDTO, nuevoWorkflow: Workflow, findDocument: Documents): Promise<Documents> {
  //   try {
  //     return this.actualizarDocumento(id, updateDocumentDTO, nuevoWorkflow);
  //   } catch (error) {
  //     throw new Error('No se pudo cargar el archivo');
  //   }
  // }

  // private async actualizarDocumentoSinArchivoYWorkflow(id: string, updateDocumentDTO: UpdateDocumentDTO, nuevoWorkflow: Workflow, findDocument: Documents): Promise<Documents> {
  //   const documentationType = await this.getDocumentationTypeData(updateDocumentDTO.documentTypeName);

  //   return this.actualizarDocumento(id, updateDocumentDTO, nuevoWorkflow);
  // }

  // private async actualizarDocumento(id: string, updateDocumentDTO: UpdateDocumentDTO, nuevoWorkflow: Workflow): Promise<Documents> {
  //   const updateDocument = {
  //     ...updateDocumentDTO,
  //     workflow: nuevoWorkflow, // Aquí asignamos el nuevo workflow al documento
  //   };

  //   return this.documentModel.findOneAndUpdate({ _id: id }, updateDocument, { new: true }).exec();
  // }
  //---------------------------------------------------------

  ///--------------------
  //----------------------------
  //------------------------

  async enviarDocument(
    documentId: string,
    addWorkflowDocumentDto: AddWorkflowDocumentDto,
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
    // const workflowData: Workflow = await this.workflowModel.findOne({
    //   nombre: worflowName,
    // });

    const workflowData = await this.findWorkflowByName(worflowName);
    const {
      nombre,
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
        const idOfficeUser = dataOficeUser.data[0]._id;
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
        };
      });
      const unityUsers = await Promise.all(unityUserPromises);
      pasos[pasoActual].completado = true;
      workflow.pasoActual = pasoActual + 1;
      workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;

      document.bitacoraWorkflow.push({
        oficinaActual: pasos[pasoActual].idOffice,
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos,
      });

      document.workflow = workflow;
      await document.save();
      return document;
    } else {
      throw new HttpException('todos los pasos fueron completados', 400);
    }
  }

  //------------------------------------------

  //-------------------------------

  async sendDocumentToUnity(
    documentId: string,
    addWorkflowSinCiDocumentDto: AddWorkflowSinCiDocumentDto,
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
    console.log(workflowName);

    const workflowData = await this.findWorkflowByName(workflowName);
    const {
      nombre,
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

    if (!workflowData) {
      throw new HttpException('no se encontro nombre del workflow', 404);
    }
    console.log(workflowData);

    // return document;

    document.workflow = workDt;

    //---------paso actual del documento ---
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.steps[0][0].pasos;

    //------- obtener lista con todos los usuarios ---
    const personalList = await this.httpService
      .get(`${process.env.API_PERSONAL_GET}`)
      .toPromise();

    const personalListData = personalList.data;
    const unitysPersonalAll = personalListData.map((user) => ({
      unity: user.unity,
      ci: user.ci,
      idOfUser: user._id,
    }));

    const obtainDatos = await Promise.all(
      unitysPersonalAll.map(async (idOfice) => ({
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
      }));

      const receivedUsersArray = [];

      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;

        document.bitacoraWorkflow.push({
          oficinaActual: pasos[pasoActual].idOffice,
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos,
        });

        document.workflow = workflow;
      }
      // await document.save();
      return document;
    } else {
      throw new HttpException('se llego la paso final', 400);
    }
  }

  async findWorkflowByName(workflowName: string): Promise<Workflow | null> {
    const workflowData = await this.workflowModel
      .findOne({ nombre: workflowName })
      .exec();
    return workflowData;
  }

  //-----------------------------------------------------------------

  async derivarDocumentAll(documentId: string): Promise<Documents> {
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
    const personalList = await this.httpService
      .get(`${process.env.API_PERSONAL_GET}`)
      .toPromise();

    const personalListData = personalList.data;
    const unitysPersonalAll = personalListData.map((user) => ({
      unity: user.unity,
      ci: user.ci,
      idOfUser: user._id,
    }));

    const obtainDatos = await Promise.all(
      unitysPersonalAll.map(async (idOfice) => ({
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
      }));

      const receivedUsersArray = [];

      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;

        document.bitacoraWorkflow.push({
          oficinaActual: pasos[pasoActual].idOffice,
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos,
        });

        document.workflow = workflow;
      }
      await document.save();
      return document;
    } else {
      throw new HttpException('se llego la paso final', 400);
    }
  }

  async derivarDocumentWithCi(documentId: string, ci: string[]) {
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
    if (pasoActual < pasos.length) {
      const unityUserPromises = ci.map(async (ci) => {
        const user = await this.httpService
          .get(`${process.env.API_PERSONAL_GET_CI}/${ci}`)
          .toPromise();
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
        const idOfficeUser = dataOficeUser.data[0]._id;
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
        };
      });
      const unityUsers = await Promise.all(unityUserPromises);
      pasos[pasoActual].completado = true;
      workflow.pasoActual = pasoActual + 1;
      workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina;

      document.bitacoraWorkflow.push({
        oficinaActual: pasos[pasoActual].idOffice,
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos,
      });

      document.workflow = workflow;
      await document.save();
      return document;
    } else {
      throw new HttpException('todos los pasos fueron completados', 400);
    }
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
      const bitacoraEntries = document.bitacoraWorkflow;
      const userIdsAndOffices = bitacoraEntries.map((entry) => ({
        userId: entry.receivedUsers[0].idOfUser,
        office: entry.oficinaActual,
      }));

      const filteredResult = userIdsAndOffices.filter(
        (entry) => entry.userId === idUser,
      );
      // console.log(filteredResult);

      const matchingEntry = document.bitacoraWorkflow.find((entry) =>
        filteredResult.some((result) =>
          entry.receivedUsers.some((user) => user.idOfUser === result.userId),
        ),
      );

      if (matchingEntry) {
        const matchingStep = document.workflow.steps[0][0].pasos.find(
          (paso) => paso.idOffice === matchingEntry.oficinaActual,
        );
        if (matchingStep) {
          const nextStepIndex = document.workflow.steps[0][0].pasos.findIndex(
            (paso) => paso === matchingStep,
          );

          if (nextStepIndex < document.workflow.steps[0][0].pasos.length - 1) {
            const nextStep =
              document.workflow.steps[0][0].pasos[nextStepIndex + 1];
            const stateSend = nextStep.completado ? 'enviado' : 'recibido';
            filteredDocumentsWithSteps.push({
              document,
              stateSend,
            });
          }
        }
      }
    }
    return filteredDocumentsWithSteps;
  }

  async showAllDocumentSend(): Promise<Documents[]> {
    const documents = await this.documentModel.find({
      workflow: { $exists: true },
    });
    // .sort({ numberDocument: 1 })
    // .setOptions({ sanitizeFilter: true })
    // .exec();
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
      document.bitacoraWorkflow.push({
        oficinaActual: selectedPaso.idOffice,
        receivedUsers,
        motivoBack: 'El motivo para volver atras fue: ' + motivo,
        oficinasPorPasar: pasos,
      });
    }
    document.workflow = workflow;
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
        documents.base64Template =
          'data:' + res.data.file.mime + res.data.file.base64;
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

  async addComment(id: string, comment: any) {
    let document: DocumentDocument = await this.documentModel.findById(id);
    document.comments.push(comment);
    document.save();
    return document;
  }

  async addMilestones(id: string, milestone: any) {
    let document: DocumentDocument = await this.documentModel.findById(id);
    document.milestone.push(milestone);
    document.save();
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

  async updateWorkflowStep(
    documentId: string,
    updateStepDocumentDto: UpdateSteDocumentDto,
  ) {
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      // Handle document not found
      throw new NotFoundException('Documento no encontrado');
    }
    if (document.active === false) {
      throw new HttpException(
        `documento con id: ${documentId} fue eliminado`,
        400,
      );
    }

    const { nameOfice, numberPaso } = updateStepDocumentDto;
    const pasoSearch = numberPaso;
    const nameOficeVal = nameOfice;
    const validateOffice = await this.stepService.checkOfficeValidity(
      nameOficeVal,
    );
    await this.stepService.validateOffice(nameOficeVal);

    const workflow = document.workflow;
    const steps = workflow.steps;

    if (
      !steps ||
      steps.length === 0 ||
      !steps[0][0] ||
      steps[0][0].length === 0
    ) {
      throw new NotFoundException(`No se encontraron pasos en el workflow`);
    }

    const selectedStep = steps[0][0].pasos.find(
      (paso) => paso.paso === pasoSearch,
    );

    if (!selectedStep) {
      throw new NotFoundException(
        `Paso ${pasoSearch} no encontrado en el workflow`,
      );
    }
    if (selectedStep.completado === false) {
      selectedStep.idOffice = validateOffice.id;
      await document.save();
      return document;
    } else {
      throw new HttpException(
        `el paso seleccionado: ${pasoSearch} del documento; la unidad esta siendo usada o el documento ya paso por dicha unidad `,
        400,
      );
    }
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

  createDocx(): void {
    const docum = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun('Hello World')],
            }),
          ],
        },
      ],
    });

    Packer.toBuffer(docum).then((buffer) => {
      fs.writeFileSync('My document.docx', buffer);
    });
  }
}
