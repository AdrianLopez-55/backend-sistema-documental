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
import getConfig from '../config/configuration'
import { ApiService } from 'src/ServiceApi/api.service';
import { FilterDto } from './dto/filter.dto';
import { WorkflowService } from 'src/workflow/workflow.service';
import { Workflow, WorkflowDocuments } from 'src/workflow/schemas/workflow.schema';
import * as PDFDocument from 'pdfkit';
import { DocumentsFilter } from './dto/documents-filter.dto';
import { Observable } from 'rxjs'; // Asegúrate de importar Observable desde 'rxjs'
import { AxiosResponse } from 'axios';
import { map } from 'rxjs/operators';

@Injectable()
export class DocumentsService {
  private defaultLimit: number;
  private readonly apiFilesUploader = process.env.API_FILES_UPLOADER;

  constructor(
    @InjectModel(Documents.name)
    private readonly documentModel: Model<DocumentDocument>,
    private readonly httpService: HttpService,
    @InjectModel(DocumentationType.name) private documentationTypeModel: Model<DocumentationTypeDocument>,
    private readonly documentationTypeService: DocumentationTypeService,
    // private readonly documentationTypesModel: Model<DocumentationTypeDocument>,
    private readonly apiService: ApiService,
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocuments>,
    private readonly workflowService: WorkflowService,
  ) {}

    //---------------------------- create new document ---------------
  async create(createDocumentDTO: CreateDocumentDTO): Promise<Documents> {
    const file = createDocumentDTO.file;
    //--------------------------------------------------------------------------------------------------------
    const { title, documentTypeName, stateDocument, workflowName, description } = createDocumentDTO;
    const workflowData = await this.workflowModel.findOne({ nombre: workflowName });
    const documentationTypeData = await this.documentationTypeModel.findOne({ typeName: documentTypeName });

    //--------------------------------------------------------------------------------------------------------

    // const responseDocumentationType = await this.getDocumentationTypeData(createDocumentDTO.documentTypeName);
    // const responseOrganigramaName = await this.getOrganigramaData(createDocumentDTO.documentDestinations);
    // const workflow = await this.workflowService.getWorkflowByName(createDocumentDTO.workflowName)


    if(file != undefined && file !== null){
      if(!workflowData){
        throw new HttpException('worflow no encontrado', 404)
      }
      if(!documentationTypeData){
        throw new HttpException(`no se encontro el tipo de documento`, 404)
      }
      return this.createDocumentWithFile(createDocumentDTO, documentationTypeData, workflowData);
    } else {
      if(!workflowData){
        throw new HttpException('worflow no encontrado', 404)
      }
      if(!documentationTypeData){
        throw new HttpException(`no se encontro el tipo de documento`, 404)
      }
      return this.createDocumentWithoutFile(createDocumentDTO, documentationTypeData, workflowData);
    }
  }

  private async createDocumentWithFile(
    createDocumentDTO: CreateDocumentDTO,
    documentationTypeData: DocumentationType,
    workflowData: Workflow,
  ): Promise<Documents>{
    const { file } = createDocumentDTO
    const mimeType = file.split(';')[0].split(':')[1];
    const base64 = file.split(',')[1];
    const fileObj = {
    mime: mimeType,
    base64: base64,
    };
    const response = await this.httpService
    .post(`${this.apiFilesUploader}/files/upload`, { file: fileObj })
    .toPromise();
    const { _id, filename, size, filePath, status, category, extension } = response.data.file;
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
    workflow: workflowData,
  });
  return newDocument.save();
  }

  private async createDocumentWithoutFile(
    createDocumentDTO: CreateDocumentDTO,
    // responseDocumentationType: ObtainDataDocumentationTypeDto,
    documentationTypeData: DocumentationType,
    // responseOrganigramaName: any,
    workflowData: Workflow,
  ): Promise<Documents>{
    const newDocument = new this.documentModel({
      ...createDocumentDTO,
      documentationType: documentationTypeData,
      workflow: workflowData
    });

    return newDocument.save();
  }

  //---------------------------------- update -------------------------
  async update(id: string, updateDocumentDTO: UpdateDocumentDTO):Promise<Documents>{
    const findDocument = await this.documentModel.findById(id).exec();
    if(!findDocument){
      throw new NotFoundException(`documento con id: ${id} no existe`)
    }
    if(!findDocument.active){
      throw new HttpException(`Documento con id: ${id} fue borrado`, 404)
    }
    const { workflowName, documentTypeName, description, stateDocument, title } = updateDocumentDTO
    if(description !== undefined && description !== ""){
      findDocument.description = description
    }
    if(stateDocument !== undefined && stateDocument !== ""){
      findDocument.stateDocument = stateDocument
    }
    if(title !== undefined && title !== ""){
      findDocument.title = title
    }
    // const workflow = await this.workflowService.getWorkflowByName(updateDocumentDTO.workflowName)
    const workflow = await this.workflowModel.findOne({ nombre:  workflowName})
    const documentationType = await this.documentationTypeModel.findOne({ typeName: documentTypeName })
    if(workflowName !== undefined && workflowName !== ""){
      findDocument.workflow = workflow
    }
    if(documentTypeName !== undefined && documentTypeName !== ""){
      findDocument.documentationType = documentationType
    }
    if(updateDocumentDTO.file && updateDocumentDTO.file.startsWith('data')){
      return this.updateDocumentWithFile(id, updateDocumentDTO, findDocument, workflow, documentationType);
    } else {
      return this.updateDocumentWithoutFile(id, updateDocumentDTO, findDocument, workflow, documentationType);
    }
  }

  private async updateDocumentWithFile(id: string, updateDocumentDTO: UpdateDocumentDTO, findDocument: Documents, workflow: Workflow, documentationType: DocumentationType):Promise<Documents>{
    try {
      const fileObj = this.extractFileData(updateDocumentDTO.file);
      const response = await this.uploadFile(fileObj);

      const fileRegister = this.createFileRegister(response.data.file);
      
      return await this.updateDocument(id, updateDocumentDTO, fileRegister, documentationType, workflow)
    } catch(error){
      throw new Error('no se pudo cargar el archivo')
    }
  }

  private async updateDocumentWithoutFile(id: string, updateDocumentDTO: UpdateDocumentDTO, findDocument: Documents, workflow: Workflow, documentationType: DocumentationType): Promise<Documents>{

    return this.updateDocument(id, updateDocumentDTO, findDocument.fileRegister, findDocument.documentationType, findDocument.workflow);
  }

  private async updateDocument(id: string, updateDocumentDTO: UpdateDocumentDTO, fileRegister: any, documentationType: DocumentationType, workflow: Workflow):Promise<Documents>{
    const updateDocument= {
      ...updateDocumentDTO,
      fileRegister,
      documentationType,
      workflow,
      
    };

    return this.documentModel.findOneAndUpdate({ _id: id }, updateDocument, { new: true }).exec();
  }

  private extractFileData(file: string): { mime: string, base64: string }{
    const mimeType = file.split(';')[0].split(':')[1];
    const base64 = file.split(',')[1];
    return { mime: mimeType, base64 }
  }

  private async uploadFile(fileObj: { mime: string, base64: string }):Promise<any>{
    return this.httpService.post(`${this.apiFilesUploader}/files/upload`, { file: fileObj }).toPromise();
  }

  private createFileRegister(fileData: any): any{
    const { _id, filename, size, filePath, status, category, extension, base64 } = fileData;
    return {
      _idFile: _id,
      filename,
      size,
      filePath,
      status,
      category,
      extension,
      base64,
    }
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

  async enviarDocument(documentId: string): Promise<Documents>{
    const document = await this.documentModel.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Documento con ID "${documentId}" no encontrado`);
    }
    if(document.active === false){
      throw new HttpException(`documento con id: ${documentId} fue eliminado`, 404)
    }

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.steps[0][0].pasos;

    if (pasoActual < pasos.length) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina
        document.bitacoraWorkflow.push({ oficinaActual: workflow.steps[0][0].pasos[pasoActual].idOffice, oficinasPorPasar: workflow.steps[0][0].pasos})
    } else {
        throw new BadRequestException('Todos los pasos ya están completados');
    }

    // Guardar el documento con el workflow modificado
    document.workflow = workflow;
    await document.save();

    return document
  }

  async selectPasoAnterior(documentId: string, numberPaso: number):Promise<Documents>{
    const document = await this.documentModel.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Documento con ID "${documentId}" no encontrado`);
  }

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;

    workflow.pasoActual = numberPaso;
    const cantidadPasos = workflow.steps[0][0].pasos.length;
    if(workflow.pasoActual > cantidadPasos){
			throw new BadRequestException('el paso no existe')
		}
    for (let i = pasoActual + 1; i < workflow.steps[0][0].pasos.length; i++) {
        	workflow.steps[0][0].pasos[i].completado = false;
    }
    if(numberPaso){
			const pasos = workflow.steps[0][0].pasos;
			for (let i = numberPaso; i < pasos.length; i++) {
				pasos[i].completado = false;
			}
		}
    workflow.oficinaActual = workflow.steps[0][0].pasos[workflow.pasoActual].oficina;
    const oficinaActual = workflow.steps[0][0].pasos[workflow.pasoActual-1].oficina;;
    document.bitacoraWorkflow.push({ oficinaActual: oficinaActual, oficinasPorPasar: workflow.steps[0][0].pasos})
    document.workflow = workflow
    await document.save()
    return document

  }

  // async marcarDocumentoLeido(documentId: string){
  //   const document = await this.documentModel.findById(documentId);
  //   if(!document){
  //     throw new Error('documento no existe para marcar como leido')
  //   }
  //   return document.save();
  // }

  async filterParams(filter: DocumentsFilter):Promise<Documents[]> {
    const query = {};

    if(filter.numberDocument){
      query['numberDocument'] = filter.numberDocument
    }

    if(filter.title){
      query['title'] = filter.title
    }

    if(filter.typeName){
      query['documentationType.typeName'] = filter.typeName
    }

    if(filter.stateDocument){
      query['stateDocument'] = filter.stateDocument
    }

    if(filter.nombre){
      query['workflow.nombre'] = filter.nombre
    }

    if(filter.description){
      query['description'] = filter.description
    }

    const filteredDocuments = await this.documentModel.find(query).sort({ numberDocument: 1 }).exec()
    return filteredDocuments;
  }

  async findAll(): Promise<Documents[]> {
    return this.documentModel
      .find()
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
  }

  async findDocumentsActive(query: any): Promise<Documents[]> {
    return this.documentModel
      .find(query)
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
  }

  async findDocumentsInactive(query: any): Promise<Documents[]> {
    return this.documentModel
      .find(query)
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
  }

  async findAllPaginate(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;
    console.log(paginationDto)
    return this.documentModel.find({ active: true }).limit(limit).skip(offset);
  }

  async findOne(id: string): Promise<Documents> {
    return this.documentModel.findOne({ _id: id }).exec();
  }

  async getDocumentVersion(id: string, version: number): Promise<Documents> {
    const document = await this.documentModel
      .findOne({ _id: id, __v: version })
      .select('-__v')
      .lean()
      .exec();

    if (!document) {
      throw new NotFoundException('Versión del documento no encontrada');
    }

    return document;
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
            data: response.data
          },
        };
        return formattedData;
      })
    );
  }

  async updateWorkflowStep(
    documentId: string,
  ): Promise<Documents>{
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      // Handle document not found
      throw new NotFoundException('Documento no encontrado');
    }
    // Crear el nuevo paso
    const nuevoPaso: WorkflowStep = {
      paso: 6,
      oficina: "nueva_oficina",
      completado: false,
      _id: "nuevo_id",
    };
    console.log(document.workflow.steps[0][0].pasos)

     // Asegurarse de que pasosExistentes sea una matriz antes de intentar push
     if (Array.isArray(document.workflow.steps[0])) {
       const pasosExistentes = document.workflow.steps[0][0].pasos;
       console.log(pasosExistentes)

      // Agregar el nuevo paso a la lista de pasos
      pasosExistentes.push(nuevoPaso);

      // Guardar el documento actualizado en la base de datos
      await document.save();

      return document;
    } else {
      console.log()
      throw new Error('La estructura de pasos no es la esperada');
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
}