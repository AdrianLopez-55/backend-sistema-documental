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
import mongoose from 'mongoose';
import { string } from 'joi';
import { Milestone } from './schema/milestone.schema';
import { StateDocumentSchema } from 'src/state-document/schemas/state-document.schema';

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

  async createMultiDocuments() {
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
    const numberOfDocumentsToGenerate = 500;
    const DocumentsSchema = new mongoose.Schema({
      numberDocument: String,
      userId: String,
      // userInfo: { String },
      title: String,
      documentationType: String,
      stateDocumentUserSend: String,
      // stateDocumetUser: String,
      // userReceivedDocument: [String],
      // userReceivedDocumentWithoutWorkflow: [String],
      // oficinaActual: String,
      // oficinaPorPasar: String,
      // workflow: null,
      description: String,
      // filesRegister: null,
      // fileBase64: [String],
      // idTemplate: String,
      // base64Template: String,
      // comments: Comment,
      // milestone: Milestone,
      active: Boolean,
      year: String,
      state: String,
      // counter: Number,
    });

    const documentModel = mongoose.model<DocumentDocument>(
      'Document',
      DocumentsSchema,
    );
    const documentsToCreate: Partial<DocumentDocument>[] = [];
    for (let i = 0; i < numberOfDocumentsToGenerate; i++) {
      const newDocument: Partial<DocumentDocument> = {
        numberDocument: `DOC-${i + 1}-year`,
        userId: `asd${i + 1}`,
        title: `titulo${i + 1}`,
        documentationType: null,
        stateDocumentUserSend: `asdff${i + 1}`,
        // workflow: null,
        description: `descri${i + 1}`,
        // filesRegister: null,
        active: true,
        year: `234${i + 1}`,
        state: `adfasdf${i + 1}`,
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

  // async deleteGenerateDocument(){
  //   try {
  //     const result = await documentModel.deleteMany({ title:/^Document\d+$/ });

  //   } catch (error) {

  //   }
  // }

  async create(createDocumentDTO: CreateDocumentDTO, userId: string) {
    const { files, documentTypeName } = createDocumentDTO;
    const documentationTypeData =
      await this.findDocumentationTypeService.findDocumentationType(
        documentTypeName,
      );
    let fileRegister = [];
    if (!files || !Array.isArray(files) || files.length === 0) {
      return this.functionCreateDocument(
        createDocumentDTO,
        documentationTypeData,
        userId,
      );
    }
    if (files.length > 0) {
      for (const file of files) {
        const { mime, base64 } = this.extractFileData(file);
        const fileObj = {
          mime: mime,
          base64: base64,
        };
        const response = await this.uploadFile(fileObj);
        // console.log('ESTO ES RESPONSE.DATA DE CREATE DOCUMENT FILE');
        // console.log(response.data);
        const fileRegisterItemData = this.createFileRegister(
          response.data.file,
        );
        const fileRegisterItem = {
          idFile: fileRegisterItemData.idFile,
          status: fileRegisterItemData.status,
          extension: fileRegisterItemData.extension,
        };
        fileRegister.push(fileRegisterItem);
      }
      const newDocument = new this.documentModel({
        ...createDocumentDTO,
        filesRegister: fileRegister, // Colocamos el objeto fileRegister en un array
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
  }

  async getBase64Documents(id: string) {
    const document = await this.checkDocument(id);
    const base64Documents = [];
    if (document.filesRegister.length > 0) {
      for (const file of document.filesRegister) {
        const idFile = file.idFile;
        try {
          const res = await this.httpService
            .get(`${this.apiFilesUploader}/file/${idFile}`)
            .toPromise();
          base64Documents.push({
            idFile: idFile,
            base64File: res.data.file.base64,
          });
        } catch (error) {
          document.fileBase64 = null;
        }
      }
      return {
        idDocument: id,
        base64Document: base64Documents,
      };
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
  ) {
    const { documentTypeName, files } = updateDocumentDTO;
    const documentationType =
      await this.findDocumentationTypeService.findDocumentationType(
        documentTypeName,
      );

    if (!files || !Array.isArray(files) || files.length === 0) {
      const updateDocument = {
        ...updateDocumentDTO,
        documentationType,
      };
      const updateNewDocument = await this.documentModel
        .findOneAndUpdate({ _id: id }, updateDocument, { new: true })
        .exec();
      return updateNewDocument;
    }
    if (files.length > 0) {
      // const showUpdateDocument: Documents[] = [];
      const fileRegister = [];
      for (const file of files) {
        if (file.startsWith('data')) {
          const { mime, base64 } = this.extractFileData(file);
          const fileObj = {
            mime,
            base64,
          };
          const response = await this.uploadFile(fileObj);
          const fileRegisterItem = this.createFileRegister(response.data.file);
          fileRegister.push(fileRegisterItem);
        }
      }
      const updateDocument = {
        ...updateDocumentDTO,
        filesRegister: fileRegister,
        documentationType,
      };
      const updateNewDocument = await this.documentModel
        .findOneAndUpdate({ _id: id }, updateDocument, { new: true })
        .exec();

      const savedDocument = await updateNewDocument.save();
      return savedDocument;
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

  //echo
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
      if (document.stateDocumentUserSend === 'INICIADO') {
        throw new HttpException(`El documento ya fue enviado por usted`, 400);
      }
      const documentSend = await this.sendDocument(
        documentId,
        worflowName,
        ci,
        userId,
      );
      return documentSend;
    }
  }

  //echo
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
      if (document.stateDocumentUserSend === 'INICIADO') {
        throw new HttpException(`El documento ya fue enviado por usted`, 400);
      }
      const documentSend = await this.sendDocumentWithoutCi(
        documentId,
        workflowName,
        userId,
      );
      return documentSend;
    }
  }

  //echo
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

    const findMarkDocuments = document.userReceivedDocument.some((entry) => {
      return entry.idOfUser === userId;
    });
    if (!findMarkDocuments) {
      throw new HttpException(`Usted no puede derivar el documento`, 400);
    }

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
        stateDocumentUser: 'RECIBIDO',
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

        // Cambiar el estado del documento a 'DERIVADO' en receivedUsers
        document.bitacoraWorkflow[
          document.bitacoraWorkflow.length - 1
        ].receivedUsers
          .filter((user) => user.idOfUser === userId)
          .forEach((user) => (user.stateDocumentUser = 'DERIVADO'));

        //--poner valor del siguiente oficina
        for (let i = 0; i < pasos.length; i++) {
          const paso = pasos[i];
          if (!paso.completado) {
            document.oficinaPorPasar = paso.oficina;
          } else {
            document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
          }
        }
        document.oficinaActual = workflow.oficinaActual;

        document.userReceivedDocument = receivedUsers;
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

  //echo
  async derivarDocumentWithCi(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);
    await this.validarDerivacion(document, userId);

    await this.validateCi(ci);

    const findMarkDocuments = document.userReceivedDocument.some((entry) => {
      return entry.idOfUser === userId;
    });
    if (!findMarkDocuments) {
      throw new HttpException(`Usted no puede derivar el documento`, 400);
    }

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
          stateDocumentUser: 'RECIBIDO',
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos.map((paso) => ({
          paso: paso.paso,
          idOffice: paso.idOffice,
          oficina: paso.oficina,
          completado: paso.completado,
        })),
      });

      const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
        return entry.receivedUsers.some((user) => user.idOfUser === userId);
      });

      const updateBitacoraEntry = {
        ...bitacoraEntry,
        receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
          if (user.idOfUser === userId) {
            user.stateDocumentUser = 'DERIVADO';
          }
          return user;
        }),
      };
      const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
        return entry === bitacoraEntry ? updateBitacoraEntry : entry;
      });

      const newUserRecievedDocument = unityUsers.map((user) => ({
        ciUser: user.ci,
        idOfUser: user.idOfUser,
        nameOfficeUserRecieved: user.unityUser,
        dateRecived: new Date(),
        observado: false,
        stateDocumentUser: 'RECIBIDO',
      }));

      //--poner valor del siguiente oficina
      for (let i = 0; i < pasos.length; i++) {
        const paso = pasos[i];
        if (!paso.completado) {
          document.oficinaPorPasar = paso.oficina;
        } else {
          document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
        }
      }
      document.oficinaActual = workflow.oficinaActual;

      document.userReceivedDocument = newUserRecievedDocument;
      document.bitacoraWorkflow = updateBitacoraWorkflow;
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

  //echo
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
    const userReceivedDocumentWithoutWorkflow = unityUsers.map((user) => ({
      ciUser: user.ci,
      idOfUser: user.idOfUser,
      nameOfficeUserRecieved: user.unityUser,
      dateRecived: new Date(),
      stateDocumentUser: 'RECIBIDO DIRECTO',
    }));

    document.userReceivedDocumentWithoutWorkflow =
      userReceivedDocumentWithoutWorkflow;
    document.stateDocumentUserSend = 'ENVIADO DIRECTO';
    await document.save();
    return document;
  }

  //----------------------

  /*
  async sendDocumentMultiUnitysWithoutWorkflow(
    documentId: string,
    unitys: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);

    if (document.workflow) {
      throw new HttpException(
        'este documento cuenta con un flujo de trabajo',
        400,
      );
    }

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

    const reeeee = obtainDatos.map((response) => ({
      nameUnity: response.info.data[0].name,
      idOficce: response.info.data[0]._id,
      idOfUser: response.idOfUser,
      ci: response.ci,
    }));

    const matchingUsers = reeeee.filter(
      (datata) => datata.nameUnity === unitys,
    );

    const receivedUsers = matchingUsers.map((data) => ({
      ciUser: data.ci,
      idOfUser: data.idOfUser,
      nameOfficeUserRecieved: data.nameUnity,
      dateRecived: new Date(),
      stateDocumentUser: 'RECIBIDO',
    }));
    console.log(receivedUsers)






    /*
    // verificar la oficina actual del usuario logeado
    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOffice = loggedUser.data.unity;

    //obtener informacion de las oficinas a las que se enviara el documento
    const officeInfoPromises = unitys.map(async (unity) => {
      const response = await this.httpService
        .get(
          `${this.apiOrganizationChartMain}?name=${encodeURIComponent(unity)}`,
        )
        .toPromise();
      const organigramaList = response.data;
      try {
        const officeInfo = await this.checkOfficeValidity(unity);
        await this.validateOffice(unity);
        return {
          idOfficeUserSend: officeInfo.id,
          nameOficeUserSend: officeInfo.name,
          idUserSend: userId,
          send: [
            {
              nameUnity: unity,
              receivedUsers: [],
            },
          ],
        };
      } catch (error) {
        throw new Error(error);
      }
    });
    const officeInfoList = await Promise.all(officeInfoPromises);

    //obtener informacoin de los usuarios de las oficinas seleccionadas
    const usersToNotifyPromises = officeInfoList.map(async (officeInfo) => {
      // const response = await this.httpService
      //   .get(`${this.apiPersonalGet}?unity=${officeInfo.send[0].nameUnity}`)
      //   .toPromise();
      const 

      return response.data.filter(
        (user: any) => user.ci !== loggedUser.data.ci,
      );
    });
    const usersToNotifyList = await Promise.all(usersToNotifyPromises);

    // Crear una entrada en la estructura sendMultiUnitysWithoutWorkflow para cada usuario
    const currentDate = new Date();
    usersToNotifyList.forEach((users, index) => {
      const officeInfo = officeInfoList[index];
      users.forEach((user: any) => {
        officeInfo.send[0].receivedUsers.push({
          ciUser: user.ci,
          idOfUser: user._id,
        });
      });
    });

    // Agregar la estructura sendMultiUnitysWithoutWorkflow al documento
    if (!document.sendMultiUnitysWithoutWorkflow) {
      document.sendMultiUnitysWithoutWorkflow = [];
    }
    document.sendMultiUnitysWithoutWorkflow.push(...officeInfoList);

    // Actualizar el estado del documento
    document.stateDocumetUser = 'ENVIADO DIRECTO';
    document.stateDocumentUserSend = 'ENVIADO DIRECTO';

    await document.save();
    return document;

    
  }
  */

  async sendDocumentMultiUnitysWithoutWorkflow(
    documentId: string,
    unitys: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);

    if (document.workflow) {
      throw new HttpException(
        'este documento cuenta con un flujo de trabajo',
        400,
      );
    }

    // Verificar la oficina actual del usuario logeado
    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOffice = loggedUser.data.unity;

    // Obtener información de las oficinas a las que se enviará el documento
    const officeInfoPromises = unitys.map(async (unity) => {
      const response = await this.httpService
        .get(
          `${this.apiOrganizationChartMain}?name=${encodeURIComponent(unity)}`,
        )
        .toPromise();
      return {
        idOfficeUserSend: userOffice,
        nameOficeUserSend: userOffice,
        idUserSend: userId,
        send: [
          {
            nameUnity: unity,
            idUnity: response.data[0]?._id || '',
            receivedUsers: [],
          },
        ],
      };
    });

    const officeInfoList = await Promise.all(officeInfoPromises);

    // Obtener información de los usuarios de las unidades a las que se enviará el documento
    const usersToNotifyPromises = unitys.map(async (unity) => {
      // Realizar una llamada al servicio externo para obtener la `idUnity` de cada usuario
      const usersResponse = await this.httpService
        .get(`${this.apiPersonalGet}?unity=${unity}`)
        .toPromise();

      // Obtener la `idUnity` de cada usuario
      const users = usersResponse.data;
      const unityIdsPromises = users.map(async (user: any) => {
        // Realizar una llamada al servicio externo para obtener la `idUnity` de cada usuario
        const unityResponse = await this.httpService
          .get(`${this.apiOrganizationChartMain}?unity=${user.unity}`)
          .toPromise();
        const exacMatch = unityResponse.data.find(
          (result) => result.name === user.unity,
        );
        const idOfficeUser = exacMatch._id;
        return idOfficeUser;
      });

      const unityIds = await Promise.all(unityIdsPromises);

      return { users, unityIds };
    });

    const usersToNotifyLists = await Promise.all(usersToNotifyPromises);

    // Crear una entrada en la estructura sendMultiUnitysWithoutWorkflow para cada usuario
    usersToNotifyLists.forEach((usersInfo, index) => {
      const officeInfo = officeInfoList[index];
      usersInfo.users.forEach((user: any, userIndex: number) => {
        const unityId = usersInfo.unityIds[userIndex];
        if (unityId === officeInfo.send[0].idUnity) {
          // Comparar la `idUnity` obtenida
          officeInfo.send[0].receivedUsers.push({
            ciUser: user.ci,
            idOfUser: user._id,
          });
        }
      });
    });

    // Agregar la estructura sendMultiUnitysWithoutWorkflow al documento
    if (!document.sendMultiUnitysWithoutWorkflow) {
      document.sendMultiUnitysWithoutWorkflow = [];
    }
    document.sendMultiUnitysWithoutWorkflow.push(...officeInfoList);

    // Actualizar el estado del documento
    document.stateDocumetUser = 'ENVIADO DIRECTO';
    document.stateDocumentUserSend = 'ENVIADO DIRECTO';

    await document.save();
    return document;
  }

  async getRecievedDocumentsMultiUnitys(userId: string) {
    try {
      // Busca el primer documento que contiene el usuario en la lista receivedUsers
      const document = await this.documentModel
        .findOne({
          'sendMultiUnitysWithoutWorkflow.send.receivedUsers.idOfUser': userId,
        })
        .exec();

      // Si se encontró un documento, lo devuelve; de lo contrario, devuelve null
      return document || null;
    } catch (error) {
      // Manejo de errores, por ejemplo, lanzar una excepción si hay un error
      throw new Error('Error al buscar el documento del usuario');
    }
  }
  //-----------------------------------

  //echo
  async markDocumentReviewed(id: string, userId: string): Promise<Documents> {
    const document = await this.checkDocument(id);

    const userMarkReviewed = document.userReceivedDocument.find((entry) => {
      return entry.idOfUser === userId;
    });

    console.log('esto es userMarkReviewed');
    console.log(userMarkReviewed);

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

    const pasos = document.workflow.step.pasos;
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
    const documents = await this.documentModel.find().exec();

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

      document.userReceivedDocument.find((entry) => {
        return (
          entry.idOfUser === userId && entry.stateDocumentUser === 'REVISADO'
        );
      });
    }
    return document;
  }

  //---------------------------------

  //echo
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
      const pasos = document.workflow.step.pasos;
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

  //echo
  async showRecievedDocumentWithouWorkflow(
    userId: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel.find({ active: true }).exec();
    let showDocuments = [];
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
      const filteredDocumentsUserSome =
        document.userReceivedDocumentWithoutWorkflow.some((entry) => {
          return entry.idOfUser === userId;
        });
      if (filteredDocumentsUserSome) {
        document.stateDocumetUser = 'RECIBIDO DIRECTO';
        showDocuments.push(document);
      }
    }
    showDocuments.sort((a, b) => {
      const dateA = new Date(
        a.userReceivedDocumentWithoutWorkflow[0]?.dateRecived,
      ).getTime();
      const dateB = new Date(
        b.userReceivedDocumentWithoutWorkflow[0]?.dateRecived,
      ).getTime();
      return dateB - dateA;
    });
    return showDocuments;
  }

  //echo
  async showRecievedDocument(idUser: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    const findDocument = await this.functionObtainAndDerivedDocument(
      documents,
      idUser,
    );
    return findDocument;
  }

  //echo
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

  //echo
  async showDocumentsMarkComplete(userId: string) {
    const documents = await this.documentModel.find().exec();
    let showDocuments = [];
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
      const findMarkDocuments = document.userReceivedDocument.some((entry) => {
        return (
          entry.idOfUser === userId && entry.stateDocumentUser === 'CONCLUIDO'
        );
      });
      if (findMarkDocuments) {
        showDocuments.push(document);
      }
    }
    return showDocuments;
  }

  //echo
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

  //echo
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

  //echo
  async selectPasoAnterior(
    documentId: string,
    numberPaso: number,
    motivo: string,
    userId: string,
  ): Promise<Documents> {
    const document = await this.checkDocument(documentId);
    if (document.workflow === null) {
      throw new HttpException(
        'no puedes devolver un documento que no inicio un flujo de trabajo',
        400,
      );
    }

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.step.pasos;

    if (
      numberPaso < 0 ||
      numberPaso > pasos.length ||
      numberPaso == pasoActual
    ) {
      throw new BadRequestException(
        'El paso no existe o es el mismo lugar en el que se encuentra el documento',
      );
    }

    if (numberPaso == 0 && pasoActual == 1) {
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
            stateDocumentUser: 'OBSERVADO',
          },
        ],
        oficinasPorPasar: [],
        motivoBack: motivo,
      });

      const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
        return entry.receivedUsers.some((user) => user.idOfUser === userId);
      });
      const updateBitacoraEntry = {
        ...bitacoraEntry,
        receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
          if (user.idOfUser === userId) {
            user.stateDocumentUser = 'OBSERVADO Y DEVUELTO';
          }
          return user;
        }),
      };
      const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
        return entry === bitacoraEntry ? updateBitacoraEntry : entry;
      });

      document.userReceivedDocument = [
        {
          ciUser: '',
          idOfUser: originalUserSend,
          nameOfficeUserRecieved: '',
          dateRecived: new Date(),
          stateDocumentUser: 'OBSERVADO',
          observado: true,
        },
      ];

      document.bitacoraWorkflow = updateBitacoraWorkflow;
      document.stateDocumetUser = 'OBSERVADO Y DEVUELTO';
      document.stateDocumentUserSend = 'OBSERVADO';
      const paso1 = pasos.find((paso) => paso.paso === 1);
      if (paso1) {
        paso1.completado = false;
      }
      await document.save();
      return document;
    }

    if (numberPaso == 0) {
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
            stateDocumentUser: 'OBSERVADO',
          },
        ],
        oficinasPorPasar: [],
        motivoBack: motivo,
      });

      const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
        return entry.receivedUsers.some((user) => user.idOfUser === userId);
      });
      const updateBitacoraEntry = {
        ...bitacoraEntry,
        receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
          if (user.idOfUser === userId) {
            user.stateDocumentUser = 'OBSERVADO Y DEVUELTO';
          }
          return user;
        }),
      };
      const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
        return entry === bitacoraEntry ? updateBitacoraEntry : entry;
      });

      document.userReceivedDocument = [
        {
          ciUser: '',
          idOfUser: originalUserSend,
          nameOfficeUserRecieved: '',
          dateRecived: new Date(),
          stateDocumentUser: 'OBSERVADO',
          observado: true,
        },
      ];

      document.bitacoraWorkflow = updateBitacoraWorkflow;
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
        user.stateDocumentUser = 'OBSERVADO';
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
        userDerived: userId,
        datedDerived: new Date(),
        motivoBack: motivo,
        oficinasPorPasar: pasos.map((paso) => ({
          paso: paso.paso,
          idOffice: paso.idOffice,
          oficina: paso.oficina,
          completado: paso.completado,
        })),
      });
      document.userReceivedDocument = receivedUsers;
    }

    const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
      return entry.receivedUsers.some((user) => user.idOfUser === userId);
    });
    const updateBitacoraEntry = {
      ...bitacoraEntry,
      receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
        if (user.idOfUser === userId) {
          user.stateDocumentUser = 'OBSERVADO Y DEVUELTO';
        }
        return user;
      }),
    };
    const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
      return entry === bitacoraEntry ? updateBitacoraEntry : entry;
    });
    document.bitacoraWorkflow = updateBitacoraWorkflow;

    document.workflow = workflow;
    document.stateDocumentUserSend = `OBSERVADO PARA EL PASO: ${document.workflow.pasoActual}`;
    document.stateDocumetUser = 'OBSERVADO Y DEVUELTO';
    await document.save();
    return document;
  }

  //echo
  async findDocumentsByUserIdAndObservation(
    userId: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel.find().exec();
    let showDocuments = [];
    for (const document of documents) {
      const findMarkDocuments = document.userReceivedDocument.some((entry) => {
        return (
          entry.idOfUser === userId && entry.stateDocumentUser === 'OBSERVADO'
        );
      });
      if (findMarkDocuments) {
        showDocuments.push(document);
      }
    }
    return showDocuments;
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

  //echo
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
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;

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
    // if (documents.fileRegister && typeof documents.fileRegister === 'object') {
    //   const fileRegisterObject = documents.fileRegister as unknown as {
    //     _idFile: string;
    //   };

    // try {
    //   const res = await this.httpService
    //     .get(`${this.apiFilesUploader}/file/${fileRegisterObject._idFile}`)
    //     .toPromise();
    //   documents.fileBase64 = res.data.file.base64;
    // } catch (error) {
    //   throw new HttpException('no se encontro base64 del archivo', 404);
    // }
    // }
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

  //--FUNCION PARA ENVIAR DOCUEMNTO
  private async sendDocument(
    id: string,
    workflowName: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(id);

    const workflowData = await this.findWorkflowByName(workflowName);

    const workDt = {
      nombre: workflowData.nombre,
      descriptionWorkflow: workflowData.descriptionWorkflow,
      step: workflowData.step,
      idStep: workflowData.idStep,
      pasoActual: workflowData.pasoActual,
      createdAt: workflowData.createdAt,
      activeWorkflow: workflowData.activeWorkflow,
      oficinaActual: workflowData.oficinaActual,
      updateAt: workflowData.updateAt,
    };

    document.workflow = workDt;
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
          stateDocumentUser: 'RECIBIDO',
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos,
      });

      const receivedDocumentUsers = unityUsers.map((user) => ({
        ciUser: user.ci,
        idOfUser: user.idOfUser,
        nameOfficeUserRecieved: user.unityUser,
        dateRecived: new Date(),
        stateDocumentUser: 'RECIBIDO',
        observado: false,
      }));

      //--poner valor del siguiente oficina
      for (let i = 0; i < pasos.length; i++) {
        const paso = pasos[i];
        if (!paso.completado) {
          document.oficinaPorPasar = paso.oficina;
        } else {
          document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
        }
      }
      document.oficinaActual = workflow.oficinaActual;
      document.userReceivedDocument = receivedDocumentUsers;
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
      idStep,
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
      idStep,
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
      //     'usted ya no puede derivar el documento porque ya fue derivado de su oficina',
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
        stateDocumentUser: 'RECIBIDO',
      }));

      const userReceivedDocument = matchingUsers.map((data) => ({
        ciUser: data.ci,
        idOfUser: data.idOfUser,
        nameOfficeUserRecieved: data.nameUnity,
        dateRecived: new Date(),
        stateDocumentUser: 'RECIBIDO',
        observado: false,
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

        //--poner valor del siguiente oficina
        for (let i = 0; i < pasos.length; i++) {
          const paso = pasos[i];
          if (!paso.completado) {
            document.oficinaPorPasar = paso.oficina;
          } else {
            document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
          }
        }
        document.oficinaActual = workflow.oficinaActual;
        document.userReceivedDocument = userReceivedDocument;
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

  //-------------------------------------------

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

  //--FUNCION PARA OBTENER LOS DOCUMENTOS RECIBIDOS Y DERIVADOS
  private async functionObtainAndDerivedDocument(
    documents: Documents[],
    userId: string,
  ) {
    let showDocuments = [];
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
      const filteredDocumentsUserSome = document.userReceivedDocument.some(
        (entry) => {
          return entry.idOfUser === userId;
        },
      );
      if (filteredDocumentsUserSome) {
        document.stateDocumetUser = 'RECIBIDO';
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

  //--FUNCION PARA OBTENER LOS DOCUMENTOS MARCADOS COMO REVISADOS
  private async funtionObtainReviewedDocument(
    documents: Documents[],
    userId: string,
  ) {
    return documents.filter((document) => {
      const recievedUsers = document.bitacoraWorkflow.reduce((users, entry) => {
        return users.concat(entry.receivedUsers);
      }, []);
      const userRecieved = recievedUsers.find(
        (user) => user.idOfUser === userId,
      );
      return userRecieved && userRecieved.stateDocumentUser === 'REVISADO';
    });
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

  searchInTree(data, name) {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.name === name) {
        return {
          id: item._id,
          name: item.name,
        };
      }
      if (item.children && item.children.length > 0) {
        const result = this.searchInTree(item.children, name);
        if (result) {
          return result;
        }
      }
    }
    throw new HttpException(
      'No se encontró el elemento o tiene hijos no válidos',
      400,
    );
  }

  async checkOfficeValidity(
    oficina: string,
  ): Promise<{ id: string; name: string }> {
    const response = await this.httpService
      .get(
        `${this.apiOrganizationChartMain}?name=${encodeURIComponent(oficina)}`,
      )
      .toPromise();

    const exacMatch = response.data.find((result) => result.name === oficina);
    const organigramaList = response.data;

    try {
      const officeInfo = this.searchInTree(organigramaList, oficina);
      return officeInfo;
    } catch (error) {
      throw new HttpException(
        `la oficina ${oficina} no existe en el organigrama`,
        404,
      );
    }
  }

  async validateOffice(oficina: string): Promise<void> {
    const isValid = await this.checkOfficeValidity(oficina);
    if (!isValid) {
      throw new HttpException('Oficina no válida', 400);
    }
  }
}
