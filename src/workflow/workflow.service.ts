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
// import { ErrorManager } from 'src/documentation-type/error.interceptor';
import { Request } from 'express';
import { WorkflowFilter } from './dto/workfowFilter.dto';
import { UpdatePasoWorkflowDto } from './dto/updatePasoWorkflow.dto';
import { StepService } from 'src/step/step.service';
import { StepDto } from 'src/step/dto/step.dto';
import getConfig from '../config/configuration';
import { HttpService } from '@nestjs/axios';
import { PasoDto } from 'src/step/dto/paso.dto';
import { UpdateWorkflowDto } from './dto/updateWorkflow.dto';
import { PaginationDto } from 'src/common/pagination.dto';

@Injectable()
export class WorkflowService {
  private readonly apiOrganizationChartMain =
    getConfig().api_organization_chart_main;
  private defaultLimit: number;
  constructor(
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocuments>,
    @InjectModel(Step.name) private readonly stepModel: Model<StepDocuments>,
    private readonly stepService: StepService,
    private readonly httpService: HttpService,
  ) {}

  async createWorkflow(workflowDto: WorkflowDto) {
    const { nombre, descriptionWorkflow, pasos } = workflowDto;
    const existingWorkflow = await this.workflowModel
      .findOne({ nombre })
      .exec();
    if (existingWorkflow) {
      throw new HttpException(`El nombre ${existingWorkflow} ya existe.`, 400);
    }

    //creacion del step
    let prevPaso = 0;
    for (const paso of pasos) {
      const oficina = paso.oficina;
      try {
        const officeInfo = await this.checkOfficeValidity(oficina);
        paso.idOffice = officeInfo.id;

        await this.validateOffice(oficina);
      } catch (error) {
        throw new BadRequestException(
          `Oficína no válida en el paso ${paso.paso}: ${error.message}`,
        );
      }
      if (paso.paso <= prevPaso) {
        throw new HttpException(
          `El número de paso en el paso ${paso.paso} no sigue la secuencia adecuada`,
          400,
        );
      }
      prevPaso = paso.paso;
    }
    if (!this.areStepsConsecutive(pasos)) {
      throw new HttpException(
        'Los números de paso no están en secuencia adecuada',
        400,
      );
    }

    const newStep = new this.stepModel({
      // step: step.step,
      // descriptionStep: step.descriptionStep,
      pasos: pasos,
    });
    await newStep.save();
    console.log('esto es newStep');
    console.log(newStep);

    const nuevoWorkflow = new this.workflowModel({
      nombre: nombre,
      descriptionWorkflow: descriptionWorkflow,
      // step: newStep.step,
      // descriptionStep: newStep.descriptionStep,
      pasos: newStep.pasos,

      idStep: newStep._id,
      oficinaActual: 'aun no se envio a ninguna oficina para su seguimiento',
    });

    return nuevoWorkflow.save();
  }

  async findAll(): Promise<Workflow[]> {
    return this.workflowModel.find().sort({ nombre: 1 }).exec();
  }

  async findAllPaginate(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, page = 1 } = paginationDto;

    const offset = (page - 1) * limit;

    const workflows = await this.workflowModel.find().limit(limit).skip(offset);

    const total = await this.workflowModel.countDocuments().exec();
    return {
      data: workflows,
      total: total,
      totalPages: Math.ceil(total / limit),
    };
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

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto) {
    const workflow = await this.workflowModel.findById(id).exec();
    if (!workflow) {
      throw new NotFoundException(`Workflow con ID "${id}" no encontrado`);
    }
    if (workflow.activeWorkflow === false) {
      throw new HttpException('el workflow fue borrado', 404);
    }
    const step = await this.stepModel.findById(workflow.idStep);

    return await this.workflowModel.findByIdAndUpdate(id, updateWorkflowDto, {
      new: true,
    });
  }

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
    if (filter.descriptionWorkflow) {
      query['descriptionWorkflow'] = filter.descriptionWorkflow;
    }
    if (filter.step) {
      query['step'] = {
        $elemMatch: { step: filter.step },
      };
    }
    if (filter.descriptionStep) {
      query['step'] = {
        $elemMatch: { descriptionStep: filter.step },
      };
    }
    if (filter.paso) {
      query['step.pasos'] = {
        $elemMatch: { paso: filter.paso },
      };
    }
    if (filter.oficina) {
      query['step.pasos'] = {
        $elemMatch: { oficina: filter.oficina },
      };
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

  //----FUNCIONES AUXILIARES
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

  areStepsConsecutive(pasos: PasoDto[]): boolean {
    const sortedPasos = pasos.slice().sort((a, b) => a.paso - b.paso);
    for (let i = 0; i < sortedPasos.length - 1; i++) {
      if (sortedPasos[i].paso + 1 !== sortedPasos[i + 1].paso) {
        return false;
      }
    }
    return true;
  }

  async validateOffice(oficina: string): Promise<void> {
    const isValid = await this.checkOfficeValidity(oficina);
    if (!isValid) {
      throw new HttpException('Oficina no válida', 400);
    }
  }
}
