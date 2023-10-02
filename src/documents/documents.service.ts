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
import * as PDFDocument from 'pdfkit';
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

@Injectable()
export class DocumentsService {
  private defaultLimit: number;
  private readonly apiFilesUploader = getConfig().api_files_uploader;
  private readonly apiFilesTemplate = getConfig().api_files_template;
  private readonly apiPersonalGetCi = getConfig().api_personal_get_ci;
  private readonly apiOrganizationChartMain =
    getConfig().api_organization_chart_main;
  private readonly apiOrganizationChartId =
    getConfig().api_organization_chart_id;
  private readonly apiPersonalGet = getConfig().api_personal_get;

  constructor(
    @InjectModel(Documents.name)
    private readonly documentModel: Model<DocumentDocument>,
    private readonly httpService: HttpService,
    @InjectModel(DocumentationType.name)
    private readonly documentationTypeService: DocumentationTypeService,
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocuments>,
    // private readonly customErrorService: CustomErrorService, // private personalGetService: PersonalGetService,
    private readonly findDocumentationTypeService: FindDocumentationTypeService,
  ) {}

  async create(
    createDocumentDTO: CreateDocumentDTO,
    userId: string,
  ): Promise<Documents> {
    try {
      const { file, documentTypeName } = createDocumentDTO;
      const documentationTypeData =
        await this.findDocumentationTypeService.findDocumentationType(
          documentTypeName,
        );

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
        _idFile: string;
      };
      try {
        const res = await this.httpService
          .get(`${this.apiFilesUploader}/file/${fileRegisterObject._idFile}`)
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
      .post(`${this.apiFilesTemplate}/files/upload-template-docx`, {
        templateName: fileNamePdf,
        file: dataPdf,
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
  ): Promise<Documents> {
    const document = await this.checkDocument(id);
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
    const document = await this.checkDocument(documentId);
    const { worflowName, ci } = addWorkflowDocumentDto;
    if (!ci) {
      throw new HttpException('no se encontro ci', 400);
    }
    await this.validateCi(ci);
    if (document.stateDocumentUserSend === 'OBSERVADO') {
      if (worflowName === document.workflow.nombre) {
        const documentSend = await this.sendDocument(
          documentId,
          worflowName,
          ci,
          userId,
        );
        return documentSend;
      } else {
        throw new HttpException(
          'el documento debe enviarse al mismo flujo de trabajo',
          400,
        );
      }
    } else {
      const documentSend = await this.sendDocument(
        documentId,
        worflowName,
        ci,
        userId,
      );
      return documentSend;
    }
  }

  async sendDocumentToUnity(
    documentId: string,
    addWorkflowSinCiDocumentDto: AddWorkflowSinCiDocumentDto,
    userId: string,
  ): Promise<Documents> {
    const document = await this.checkDocument(documentId);
    const { workflowName } = addWorkflowSinCiDocumentDto;
    if (document.stateDocumentUserSend === 'OBSERVADO') {
      if (workflowName === document.workflow.nombre) {
        const documentSend = await this.sendDocumentWithoutCi(
          documentId,
          workflowName,
          userId,
        );
        return documentSend;
      } else {
        throw new HttpException(
          'el documento debe enviarse al mismo flujo de trabajo',
          400,
        );
      }
    } else {
      const documentSend = await this.sendDocumentWithoutCi(
        documentId,
        workflowName,
        userId,
      );
      return documentSend;
    }
  }

  async derivarDocumentAll(
    documentId: string,
    userId: string,
  ): Promise<Documents> {
    const document = await this.checkDocument(documentId);
    await this.validarDerivacion(document, userId);

    // verificar el estado del siguiente paso
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = document.workflow.step.pasos;

    //------- obtener lista con todos los usuarios ---
    //---------
    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;

    // verificar la oficina actual de usuario lodgeado
    const oficinaActualUsuario = userOficce;
    const oficinaUserDentroBitacora = document.workflow.step.pasos.filter(
      (dat) => dat.oficina === userOficce,
    );
    const nextPasoUserState = pasos[oficinaUserDentroBitacora[0].paso];
    const loggedUserOffice = await this.httpService
      .get(
        `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const personalList = await this.httpService
      .get(`${this.apiPersonalGet}`)
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
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              idOfice.unity,
            )}`,
          )
          .toPromise(),
        idOfUser: idOfice.idOfUser,
        ci: idOfice.ci,
      })),
    );
    if (pasoActual < pasos.length) {
      if (nextPasoUserState.completado === true) {
        throw new HttpException(
          'usted ya no puede derivar el documento porque ya fue enviado',
          400,
        );
      }
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
        dateRecived: new Date(),
        observado: false,
      }));
      const receivedUsersArray = [];
      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.step.pasos[pasoActual].oficina;

        const nameOfTheOffice = await this.httpService
          .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
          .toPromise();
        const nameOffce = nameOfTheOffice.data.name;

        document.bitacoraWorkflow.push({
          oficinaActual: pasos[pasoActual].idOffice,
          nameOficinaActual: nameOffce,
          userSend: document.userId,
          dateSend: document.bitacoraWorkflow[0].dateSend,
          userDerived: userId,
          datedDerived: new Date(),
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos.map((paso) => ({
            paso: paso.paso,
            idOffice: paso.idOffice,
            oficina: paso.oficina,
            completado: paso.completado,
          })),
        });

        document.workflow = workflow;
        document.stateDocumetUser = 'DERIVADO';
        document.stateDocumentUserSend = 'INICIADO';
      }
      await document.save();
      return document;
    } else {
      throw new HttpException('no hay a quien mas derivar', 400);
    }
  }

  async derivarDocumentWithCi(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);
    await this.validarDerivacion(document, userId);

    await this.validateCi(ci);

    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.step.pasos;
    const oficinaUserDentroBitacora = document.workflow.step.pasos.filter(
      (dat) => dat.oficina === userOficce,
    );
    const nextPasoUserState = pasos[oficinaUserDentroBitacora[0].paso];
    if (pasoActual < pasos.length) {
      if (nextPasoUserState.completado === true) {
        throw new HttpException(
          'usted ya no puede derivar el documento porque ya fue enviado',
          400,
        );
      }
      const unityUserPromises = ci.map(async (ci) => {
        const user = await this.httpService
          .get(`${this.apiPersonalGetCi}/${ci}`)
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
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              unityUser,
            )}`,
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
      workflow.oficinaActual = workflow.step.pasos[pasoActual].oficina;

      const nameOfTheOffice = await this.httpService
        .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;

      document.bitacoraWorkflow.push({
        oficinaActual: pasos[pasoActual].idOffice,
        nameOficinaActual: nameOffce,
        userSend: document.userId,
        dateSend: document.bitacoraWorkflow[0].dateSend,
        userDerived: userId,
        datedDerived: new Date(),
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
          nameOfficeUserRecieved: user.unityUser,
          dateRecived: new Date(),
          observado: false,
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos.map((paso) => ({
          paso: paso.paso,
          idOffice: paso.idOffice,
          oficina: paso.oficina,
          completado: paso.completado,
        })),
      });

      document.workflow = workflow;
      document.stateDocumetUser = 'DERIVADO';
      document.stateDocumentUserSend = 'INICIADO';
      await document.save();
      return document;
    } else {
      throw new HttpException('no hay a quien mas derivar', 400);
    }
  }

  //----------------------------------------

  async sendDocumentSinWorkflow(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);

    if (document.workflow) {
      throw new HttpException(
        'este documento cuenta con un flujo de trabajo',
        400,
      );
    }

    await this.validateCi(ci);

    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;
    const loggedUserOffice = await this.httpService
      .get(
        `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const exacMatch = loggedUserOffice.data.find(
      (result) => result.name === userOficce,
    );

    const unityUserPromises = ci.map(async (ci) => {
      const user = await this.httpService
        .get(`${this.apiPersonalGetCi}/${ci}`)
        .toPromise();
      if (user.data._id === userId) {
        throw new HttpException(
          'No se puede enviar un documento a si mismo',
          400,
        );
      }
      if (!user) {
        throw new HttpException(`Usuario con CI: ${ci} no encontrado`, 404);
      }

      const unityUser = user.data.unity;
      const dataOficeUser = await this.httpService
        .get(
          `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
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
    document.stateDocumentUserSend = 'ENVIADO DIRECTO';
    await document.save();
    return document;
  }

  //-----------------------------------

  async markDocumentReviewed(id: string, userId: string): Promise<Documents> {
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new HttpException(`documento con id: ${id} no fue encontrado`, 404);
    }
    if (document.active === false) {
      throw new HttpException(`documento con id: ${id} fue eliminado`, 400);
    }

    const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
      return entry.receivedUsers.some((user) => user.idOfUser === userId);
    });

    if (!bitacoraEntry) {
      throw new HttpException(
        `Usuario con ID: ${userId} no tiene permiso para marcar como revisado este documento`,
        403,
      );
    }

    const pasos = document.workflow.step.pasos;
    const currentStepIndex = document.workflow.pasoActual - 1;
    if (
      currentStepIndex < pasos.length - 1 &&
      !pasos[currentStepIndex + 1].completado
    ) {
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
    const document = await this.documentModel
      .find({ stateDocumetUser: 'REVISADO' })
      .exec();
    return document;
  }

  //---------------------------------

  async markDocumentcompleted(id: string, userId: string): Promise<Documents> {
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new HttpException(`Documento con ID: ${id} no encontrado`, 404);
    }

    if (!document.active) {
      throw new HttpException(`Documento con ID: ${id} fue archivado`, 400);
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
      const pasos = document.workflow.step.pasos;
      const currentStepIndex = document.workflow.pasoActual - 1;
      if (currentStepIndex === pasos.length - 1) {
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
    idUser: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true, workflow: null })
      .exec();
    const userLogged = idUser;
    let filteredDocuments = [];
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
      const filteredDocumentsSome = document.bitacoraWithoutWorkflow.some(
        (bitacoraEntry) => {
          return bitacoraEntry.recievedUsers.some(
            (user) => user.idOfUser === userLogged,
          );
        },
      );
      if (filteredDocumentsSome) {
        document.stateDocumetUser = 'RECIBIDO';
        filteredDocuments.push(document);
      }
    }
    return filteredDocuments;
  }

  async showRecievedDocument(idUser: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    const filteredDocumentsWithSteps = [];
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
      if (document.stateDocumetUser !== 'OBSERVADO Y DEVUELTO') {
        const matchingBitacoraEntry = document.bitacoraWorkflow.find(
          (entry) => {
            return entry.receivedUsers.some((user) => user.idOfUser === idUser);
          },
        );

        if (matchingBitacoraEntry && document.workflow) {
          const matchingStep = document.workflow.step.pasos.find(
            (paso) => paso.idOffice === matchingBitacoraEntry.oficinaActual,
          );

          if (matchingStep) {
            const nextStepIndex = document.workflow.step.pasos.findIndex(
              (paso) => paso === matchingStep,
            );
            if (nextStepIndex !== -1) {
              const nextStep = document.workflow.step.pasos[nextStepIndex + 1];
              console.log(nextStep);

              if (nextStep) {
                if (nextStep.completado === true) {
                  document.stateDocumetUser = 'DERIVADO';
                } else {
                  document.stateDocumetUser = 'RECIBIDO';
                }
              }
            }
            filteredDocumentsWithSteps.push({ document });
          }
        }
      }
    }
    return filteredDocumentsWithSteps.map((dat) => dat.document);
  }

  async showAllDocumentSend(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'INICIADO' })
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
  //----------------
  async showAllDocumentsCompleted(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'CONCLUIDO' })
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

  async showAllDocumentsSendWithoutWorkflow(
    userId: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({
        workflow: null,
        stateDocumentUserSend: 'ENVIADO DIRECTO',
        userId: userId,
        active: true,
      })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();

    const filteredDocuments = [];

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
      filteredDocuments.push(document);
    }
    return filteredDocuments;
  }

  async getDocumentsOnHold(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({
        active: true,
        bitacoraWorkflow: [],
        bitacoraWithoutWorkflow: [],
        stateDocumentUserSend: 'EN ESPERA',
        userId: userId,
      })
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

  async selectPasoAnterior(
    documentId: string,
    numberPaso: number,
    motivo: string,
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
        `Documento con id: ${documentId} fue archivado`,
        400,
      );
    }
    if (document.workflow === null) {
      throw new HttpException(
        'no puedes devolver un documento que no inicio un flujo de trabajo',
        400,
      );
    }

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.step.pasos;

    if (numberPaso < 0 || numberPaso > pasos.length) {
      throw new BadRequestException('El paso no existe');
    }

    if (numberPaso == 0 && document.workflow.pasoActual == 1) {
      const originalUserSend = document.userId;
      document.bitacoraWorkflow.push({
        oficinaActual: 'remitente original',
        nameOficinaActual: 'remitente original',
        userSend: document.userId,
        dateSend: document.bitacoraWorkflow[0].dateSend,
        userDerived: userId,
        datedDerived: new Date(),
        receivedUsers: [
          {
            ciUser: '',
            idOfUser: originalUserSend,
            nameOfficeUserRecieved: '',
            dateRecived: new Date(),
            observado: true,
          },
        ],
        oficinasPorPasar: [],
        motivoBack: motivo,
      });
      document.stateDocumetUser = 'OBSERVADO Y DEVUELTO';
      document.stateDocumentUserSend = 'OBSERVADO';
      const paso1 = pasos.find((paso) => paso.paso === 1);
      if (paso1) {
        paso1.completado = false;
      }
      await document.save();
      return document;
    }

    const selectedPaso = pasos[numberPaso - 1];
    if (numberPaso === document.workflow.pasoActual) {
      throw new HttpException(
        'usted se encuentra en el paso actual al cual desea reenviar',
        400,
      );
    }

    for (let i = numberPaso; i < pasos.length; i++) {
      pasos[i].completado = false;
    }

    workflow.pasoActual = numberPaso;
    workflow.oficinaActual = selectedPaso.idOffice;

    const matchingEntry = document.bitacoraWorkflow.find(
      (entry) => entry.oficinaActual === selectedPaso.idOffice,
    );

    if (matchingEntry) {
      const receivedUsers = matchingEntry.receivedUsers;

      receivedUsers.forEach((user) => {
        user.observado = true;
      });

      const nameOfTheOffice = await this.httpService
        .get(`${this.apiOrganizationChartId}/${selectedPaso.idOffice}`)
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;

      document.bitacoraWorkflow.push({
        oficinaActual: selectedPaso.idOffice,
        nameOficinaActual: nameOffce,
        receivedUsers,
        userSend: document.userId,
        dateSend: document.bitacoraWorkflow[0].dateSend,
        userDerived: document.bitacoraWorkflow[pasoActual].userDerived,
        datedDerived: document.bitacoraWorkflow[pasoActual].datedDerived,
        motivoBack: motivo,
        oficinasPorPasar: pasos.map((paso) => ({
          paso: paso.paso,
          idOffice: paso.idOffice,
          oficina: paso.oficina,
          completado: paso.completado,
        })),
      });
    }
    document.workflow = workflow;
    document.stateDocumentUserSend = `OBSERVADO PARA EL PASO: ${document.workflow.pasoActual}`;
    document.stateDocumetUser = 'OBSERVADO Y DEVUELTO';
    await document.save();
    return document;
  }

  async findDocumentsByUserIdAndObservation(
    userId: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({
        'bitacoraWorkflow.receivedUsers': {
          $elemMatch: { idOfUser: userId, observado: true },
        },
      })
      .exec();

    return documents;
  }

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
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;
    const documents = await this.documentModel
      .find({ active: true })
      .limit(limit)
      .skip(offset);
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
    if (documents.fileRegister && typeof documents.fileRegister === 'object') {
      const fileRegisterObject = documents.fileRegister as unknown as {
        _idFile: string;
      };

      try {
        const res = await this.httpService
          .get(`${this.apiFilesUploader}/file/${fileRegisterObject._idFile}`)
          .toPromise();
        documents.fileBase64 = res.data.file.base64;
      } catch (error) {
        throw new HttpException('no se encontro base64 del archivo', 404);
      }
    }
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
      await this.documentationTypeService.getDocumentatioTypeByName(typeName);
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
  //--FUNCION PARA OBTENER EL MIME Y EL BASE64 DE UN FILE
  private extractFileData(file: string): { mime: string; base64: string } {
    const mimeType = file.split(';')[0].split(':')[1];
    const base64 = file.split(',')[1];
    return { mime: mimeType, base64 };
  }

  //--FUNCION PARA CREAR UN NUEVO DOCUMENTO
  private async functionCreateDocument(
    createDocumentDTO: CreateDocumentDTO,
    documentationTypeData: DocumentationType,
    userId,
  ): Promise<Documents> {
    const newDocument = new this.documentModel({
      ...createDocumentDTO,
      documentationType: documentationTypeData,
      stateDocumentUserSend: 'EN ESPERA',
      userId: userId,
    });
    return newDocument.save();
  }

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

  //--FUNCION PARA SUBIR UN FILEBASE64 AL SERVICIO FILE Y OBTENER SUS DATOS
  private async uploadFile(fileObj: {
    mime: string;
    base64: string;
  }): Promise<any> {
    return this.httpService
      .post(`${this.apiFilesUploader}/files/upload`, { file: fileObj })
      .toPromise();
  }

  //--FUNCION PARA OBTENER LOS DATOS NECESARIOS DEL DOCUMENTO OBTENIDO DEL SERVICIO FILE
  private createFileRegister(fileData: any): any {
    const { _id, status, category, extension } = fileData;
    return {
      _idFile: _id,
      status,
      category,
      extension,
    };
  }

  //--FUNCION PARA VALIDAR CI
  private async validateCi(ci: string[]) {
    const uniqueCi = new Set(ci);
    if (uniqueCi.size !== ci.length) {
      throw new HttpException(
        'Hay números de identificación CI duplicados',
        400,
      );
    }
  }

  //--FUNCION PARA ENVIAR DOCUEMNTO
  private async sendDocument(
    id: string,
    workflowName: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(id);

    // const workflowData = await this.findWorkflowByName(workflowName);

    const workflowData = await this.findWorkflowByName(workflowName);

    const workDt = {
      nombre: workflowData.nombre,
      descriptionWorkflow: workflowData.descriptionWorkflow,
      step: workflowData.step,
      pasoActual: workflowData.pasoActual,
      createdAt: workflowData.createdAt,
      activeWorkflow: workflowData.activeWorkflow,
      oficinaActual: workflowData.oficinaActual,
      updateAt: workflowData.updateAt,
    };

    document.workflow = workDt;

    // document.workflow = workflowData;
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.step.pasos;
    if (pasoActual < pasos.length) {
      const unityUserPromises = ci.map(async (ci) => {
        const user = await this.httpService
          .get(`${this.apiPersonalGetCi}/${ci}`)
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
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              unityUser,
            )}`,
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
      workflow.oficinaActual = workflow.step.pasos[pasoActual].oficina;
      let newBitacora = [];
      const nameOfTheOffice = await this.httpService
        .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;
      newBitacora.push({
        oficinaActual: pasos[pasoActual].idOffice,
        nameOficinaActual: nameOffce,
        userSend: userId,
        dateSend: new Date(),
        userDerived: '',
        datedDerived: '',
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
          nameOfficeUserRecieved: user.unityUser,
          dateRecived: new Date(),
          // stateDocumentUser: 'RECIBIDO',
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos,
      });

      document.workflow = workflow;
      document.stateDocumentUserSend = 'INICIADO';
      document.stateDocumetUser = '';
      document.bitacoraWorkflow = newBitacora;
      await document.save();
      return document;
    } else {
      document.stateDocumentUserSend = 'CONCLUIDO';
      await document.save();
      return document;
    }
  }

  //--FUNCION PARA ENVIAR DOCUMENTO SIN CI
  private async sendDocumentWithoutCi(
    id: string,
    workflowName: string,
    userId: string,
  ) {
    const document = await this.checkDocument(id);
    const workflowData = await this.findWorkflowByName(workflowName);
    if (!workflowData) {
      throw new HttpException('no se encontro el workflow', 400);
    }
    const {
      descriptionWorkflow,
      step,
      createdAt,
      activeWorkflow,
      oficinaActual,
      updateAt,
      nombre,
    } = workflowData;

    const workDt: Workflow = {
      nombre: workflowData.nombre,
      descriptionWorkflow,
      step,
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
    const pasos = workflow.step.pasos;

    //------- obtener lista con todos los usuarios ---
    //---- obtener info de la persona logeada y evitar su registro si trabja en
    //---- misma oficina
    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;
    const oficinaUserDentroBitacora = document.workflow.step.pasos.filter(
      (dat) => dat.oficina === userOficce,
    );

    // const nextPasoUserState = pasos[oficinaUserDentroBitacora[0].paso];
    const loggedUserOffice = await this.httpService
      .get(
        `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const exacMatch = loggedUserOffice.data.find(
      (result) => result.name === userOficce,
    );

    const personalList = await this.httpService
      .get(`${this.apiPersonalGet}`)
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
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              idOfice.unity,
            )}`,
          )
          .toPromise(),
        idOfUser: idOfice.idOfUser,
        ci: idOfice.ci,
      })),
    );

    if (pasoActual < pasos.length) {
      // if (nextPasoUserState.completado === true) {
      //   throw new HttpException(
      //     'usted ya no puede derivar el documento porque ya fue enviado',
      //     400,
      //   );
      // }

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

      const receivedUsers = matchingUsers.map((data) => ({
        ciUser: data.ci,
        idOfUser: data.idOfUser,
        nameOfficeUserRecieved: data.nameUnity,
        dateRecived: new Date(),
        // stateDocumentUser: 'RECIBIDO',
      }));

      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.step.pasos[pasoActual].oficina;
        const nameOfTheOffice = await this.httpService
          .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
          .toPromise();
        const nameOffce = nameOfTheOffice.data.name;

        let newBitacora = [];
        newBitacora.push({
          oficinaActual: pasos[pasoActual].idOffice,
          nameOficinaActual: nameOffce,
          userSend: userId,
          dateSend: new Date(),
          userDerived: '',
          datedDerived: '',
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos,
        });

        document.workflow = workflow;
        document.stateDocumentUserSend = 'INICIADO';
        document.bitacoraWorkflow = newBitacora;
      }
      await document.save();
      return document;
    } else {
      document.stateDocumentUserSend = 'CONCLUIDO';
      await document.save();
      return document;
      // throw new HttpException('se llego la paso final', 400);
    }
  }

  //--FUNCION PARA VALIDAR LA DERIVACION DE UN DOCUMENTO MEDIANTE EL USUARIO
  private async validarDerivacion(document: Documents, userId: string) {
    if (document.stateDocumetUser !== 'REVISADO') {
      throw new HttpException(
        'Primero se debe marcar el documento como revisado para derivarlo',
        400,
      );
    }
    if (document.workflow === null) {
      throw new HttpException(
        'No puedes derivar un documento que no ha comenzado un flujo de trabajo',
        400,
      );
    }
    const usuarioEnBitacora = document.bitacoraWorkflow.find((entry) =>
      entry.receivedUsers.some((user) => user.idOfUser === userId),
    );
    if (!usuarioEnBitacora) {
      throw new HttpException(
        'No tienes permisos para derivar el documento porque no lo recibiste',
        403,
      );
    }
  }

  // //--FUNCION OBTENER USUARIOS POR OFICINA
  // private async obtainedUserOffice(officeName: string, officeId: string){
  //   const personalList = (await this.httpService.get(`${this.apiPersonalGet}`).toPromise()).data;
  //   const unitysPersonalAll = personalList.map((user) => ({
  //     unity: user.unity,
  //     ci: user.ci,
  //     idOfUser: user._id,
  //   }));
  //   // return unitysPersonalAll.filter((user) => user.ci !== userId && user.unity === officeName)
  //   const filteredUnitysPersonal = unitysPersonalAll.filter(
  //     (user) => user.ci !== loggedUser.data.ci,
  //   );
  // }

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
