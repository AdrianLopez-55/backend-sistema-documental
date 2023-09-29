import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workflow, WorkflowDocuments } from './schemas/workflow.schema';
import mongoose, { Model } from 'mongoose';
import { WorkflowDto } from './dto/createWorkflow.dto';
import { Step, StepDocuments } from 'src/step/schemas/step.schema';
import { ErrorManager } from 'src/documentation-type/error.interceptor';
import { Request } from 'express';
import { WorkflowFilter } from './dto/workfowFilter.dto';
import { UpdatePasoWorkflowDto } from './dto/updatePasoWorkflow.dto';
import { StepService } from 'src/step/step.service';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocuments>,
    @InjectModel(Step.name) private readonly stepModel: Model<StepDocuments>,
    private readonly stepService: StepService,
  ) {}

  async createWorkflow(workflowDto: WorkflowDto): Promise<any> {
    const { nombre, descriptionWorkflow, stepName } = workflowDto;
    const step = await this.stepModel.findOne({ step: stepName });
    if (!step) {
      throw new NotFoundException(`Paso "${stepName}" no encontrado`);
    }

    const existingWorkflow = await this.workflowModel
      .findOne({ nombre })
      .exec();
    if (existingWorkflow) {
      throw new HttpException(`El nombre ${existingWorkflow} ya existe.`, 400);
    }

    const nuevoWorkflow = new this.workflowModel({
      nombre: nombre,
      descriptionWorkflow: descriptionWorkflow,
      step: step,
      oficinaActual: 'aun no se envio a ninguna oficina para su seguimiento',
    });

    return nuevoWorkflow.save();
  }

  async findAll(): Promise<Workflow[]> {
    return this.workflowModel.find().sort({ nombre: 1 }).exec();
  }

  async getWorkflowByName(nombre: string): Promise<Workflow> {
    try {
      const nombreWorkflow = this.workflowModel.findOne({ nombre }).exec();
      return nombreWorkflow;
    } catch (error) {
      throw new error();
    }
  }

  async findOne(id: string): Promise<Workflow> {
    const workflow = await this.workflowModel.findById({ _id: id }).exec();
    return workflow;
  }

  async getWorkflowActive(): Promise<Workflow[]> {
    const workflowDatas = await this.workflowModel
      .find({ activeWorkflow: true })
      .exec();
    return workflowDatas.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async getWorkflowInactive(): Promise<Workflow[]> {
    const workflowDataInactives = await this.workflowModel
      .find({ activeWorkflow: false })
      .exec();
    return workflowDataInactives.sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }

  async update(id: string, workflowDto: WorkflowDto): Promise<any> {
    const existingWorkflow = await this.workflowModel.findById(id).exec();
    if (!existingWorkflow) {
      throw new NotFoundException(`Workflow con ID "${id}" no encontrado`);
    }
    if (existingWorkflow.activeWorkflow === false) {
      throw new HttpException('el workflow fue borrado', 404);
    }

    const { nombre, descriptionWorkflow, stepName } = workflowDto;
    if (nombre !== undefined && nombre !== '') {
      existingWorkflow.nombre = nombre;
    }
    if (descriptionWorkflow !== undefined && descriptionWorkflow !== '') {
      existingWorkflow.descriptionWorkflow = descriptionWorkflow;
    }

    const step = await this.stepModel.findOne({ step: stepName });
    if (!step) {
      throw new NotFoundException(`Paso "${stepName}" no encontrado`);
    }
    if (stepName !== undefined && stepName !== '') {
      existingWorkflow.step = step;
    }

    const updatedWorkflow = await existingWorkflow.save();
    return updatedWorkflow;
  }

  // async updateOnlyPasoInWorkflow(
  //   id: string,
  //   updatePasoWorkflowDto: UpdatePasoWorkflowDto,
  //   tokenDat: string,
  // ) {
  //   const workflow = await this.workflowModel.findOne({ _id: id }).exec();
  //   if (!workflow) {
  //     throw new HttpException(`el workflow con id: ${id} no existe`, 404);
  //   }
  //   if (workflow.activeWorkflow === false) {
  //     throw new HttpException(`el workflow con id: ${id} fue eliminado`, 400);
  //   }

  //   const { paso, nameOfice } = updatePasoWorkflowDto;
  //   const pasoSearch = paso;
  //   const nameOficeVal = nameOfice;
  //   const validateOffice = await this.stepService.checkOfficeValidity(
  //     nameOficeVal,
  //     tokenDat,
  //   );

  //   await this.stepService.validateOffice(nameOficeVal, tokenDat);

  //   if (pasoSearch <= 0 || pasoSearch > workflow.steps[0][0].pasos.length) {
  //     throw new HttpException('el paso no existe', 400);
  //   }
  //   const selectedStep = workflow.steps[0][0].pasos[pasoSearch - 1];

  //   selectedStep.idOffice = validateOffice.id;
  //   await workflow.save();
  //   return workflow;
  // }

  async inactiverWorkflow(id: string, activeWorkflow: boolean) {
    const workflowData: WorkflowDocuments = await this.workflowModel.findById(
      id,
    );
    workflowData.activeWorkflow = false;
    await workflowData.save();
    return workflowData;
  }

  async activerWorkflow(id: string, activeWorkflow: boolean) {
    const workflowData: WorkflowDocuments = await this.workflowModel.findById(
      id,
    );
    workflowData.activeWorkflow = true;
    await workflowData.save();
    return workflowData;
  }

  async filterParams(filter: WorkflowFilter) {
    const query = {};
    if (filter.nombre) {
      query['nombre'] = filter.nombre;
    }
    if (filter.step) {
      query['steps[0][0].step'] = filter.step;
    }
    const filteredWorkflow = await this.workflowModel.find(query).exec();
    return filteredWorkflow;
  }

  async getDocumentVersion(id: string, version: number): Promise<Workflow> {
    const document = await this.workflowModel
      .findOne({ _id: id, __v: version })
      .select('-__v')
      .lean()
      .exec();

    if (!document) {
      throw new NotFoundException('Versión del documento no encontrada');
    }
    return document;
  }
}
