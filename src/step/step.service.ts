import {
  Injectable,
  Param,
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Step, StepDocuments } from './schemas/step.schema';
import { Model } from 'mongoose';
import { StepDto } from './dto/step.dto';
import { PasoDto } from './dto/paso.dto';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { UpdateStepDto } from './dto/updateStep.dto';
import { updateOnlyPasoDto } from './dto/updateOnlyPaso.dto';
import getConfig from '../config/configuration';

@Injectable()
export class StepService {
  private readonly apiOrganizationChartMain =
    getConfig().api_organization_chart_main;

  constructor(
    @InjectModel(Step.name) private stepModel: Model<StepDocuments>,
    private readonly httpService: HttpService,
  ) {}

  async crearStep(stepDto: StepDto): Promise<Step> {
    const { step, descriptionStep, pasos } = stepDto;
    let prevPaso = 0;
    for (const paso of pasos) {
      const oficina = paso.oficina;
      try {
        const officeInfo = await this.checkOfficeValidity(oficina);
        paso.idOffice = officeInfo.id;

        await this.validateOffice(oficina);
      } catch (error) {
        throw new BadRequestException(
          `Oficina no válida en el paso ${paso.paso}: ${error.message}`,
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
    const existingStep = await this.stepModel.findOne({ step }).exec();
    if (existingStep) {
      throw new HttpException('El nombre del step ya existe', 400);
    }
    if (!step) {
      throw new HttpException('se debe poner nombre al step', 400);
    }
    const newStep = new this.stepModel({
      step: step,
      descriptionStep: descriptionStep,
      pasos: pasos,
    });
    const saveStep = await newStep.save();
    return saveStep;
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

  async checkOfficeValidity(
    oficina: string,
  ): Promise<{ id: string; name: string }> {
    const organigramaUrl = `${
      this.apiOrganizationChartMain
    }?name=${encodeURIComponent(oficina)}`;
    const responseOrganigramaName = await this.httpService
      .get(organigramaUrl)
      .toPromise();

    const exacMatch = responseOrganigramaName.data.find(
      (result) => result.name === oficina,
    );
    console.log(exacMatch.name);
    const organigramaList = responseOrganigramaName.data;

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
  //-------------------------------------------------------------

  async findAllSteps(): Promise<Step[]> {
    const stepData = await this.stepModel.find().sort({ step: 1 }).exec();
    if (!stepData) {
      throw new HttpException('no se encontraron datos', 404);
    }
    return stepData;
  }

  async findAllstepsActive(): Promise<Step[]> {
    const stepActives = await this.stepModel.find({ activeStep: true }).exec();
    return stepActives.sort((a, b) => a.step.localeCompare(b.step));
  }

  async findAllStepInactive(): Promise<Step[]> {
    const stepInactives = await this.stepModel
      .find({ activeStep: false })
      .exec();
    return stepInactives.sort((a, b) => a.step.localeCompare(b.step));
  }

  async findOne(id: string): Promise<Step> {
    const findOneStepId = await this.stepModel.findOne({ _id: id }).exec();
    if (!findOneStepId) {
      throw new HttpException(`no se encontro el step con id: ${id}`, 404);
    }
    if (findOneStepId.activeStep === false) {
      throw new HttpException(`el step con id: ${id} fue borrado`, 400);
    }

    const subStepById = findOneStepId.pasos;
    console.log(subStepById);

    return findOneStepId;
  }

  async updateOnlyStep(id: string, updateOnlyPasoDto: updateOnlyPasoDto) {
    const findOneStepId = await this.stepModel.findOne({ _id: id }).exec();
    if (!findOneStepId) {
      throw new HttpException(`el step con id: ${id} no se encotro`, 404);
    }
    if (findOneStepId.activeStep === false) {
      throw new HttpException(`step con id ${id} fue eliminado`, 400);
    }

    const { nameOfice, numberPaso } = updateOnlyPasoDto;
    const oficeSearch = nameOfice;
    const pasoSearch = numberPaso;
    const validateNewOfice = await this.checkOfficeValidity(oficeSearch);
    console.log(validateNewOfice.id);
    await this.validateOffice(oficeSearch);

    const stepFind = findOneStepId.pasos.find(
      (paso) => paso.paso == pasoSearch,
    );

    if (stepFind) {
      stepFind.idOffice = validateNewOfice.id;
      await findOneStepId.save();
      return findOneStepId;
    } else {
      throw new HttpException(
        `No se encontró el paso ${pasoSearch} en el array de pasos`,
        404,
      );
    }
  }

  async update(id: string, updateStepDto: UpdateStepDto): Promise<Step> {
    const existingStep = await this.stepModel.findById(id).exec();
    if (!existingStep) {
      throw new NotFoundException(`Step con ID "${id}" no encontrado`);
    }
    if (existingStep.activeStep === false) {
      throw new HttpException('el step fue borrado', 400);
    }

    const { step, pasos } = updateStepDto;
    if (step !== undefined && step !== '') {
      existingStep.step = step;
    }

    if (pasos !== undefined && Array.isArray(pasos) && pasos.length > 0) {
      let prevPaso = 0;
      for (const paso of pasos) {
        const oficina = paso.oficina;
        try {
          const officeInfo = await this.checkOfficeValidity(oficina);
          paso.idOffice = officeInfo.id;
          await this.validateOffice(oficina);
        } catch (error) {
          throw new BadRequestException(
            `Oficina no válida en el paso ${paso.paso}: ${error.message}`,
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
      existingStep.pasos = pasos;
    }
    const updatedStep = await existingStep.save();
    return updatedStep;
  }

  async inactiverStep(id: string, activeStep: boolean) {
    const step: StepDocuments = await this.stepModel.findById(id);
    if (!step) {
      throw new HttpException(`no existe step con id: ${id}`, 404);
    }
    if (step.activeStep === false) {
      throw new HttpException(`ya se elimino el step con id: ${id}`, 400);
    }
    step.activeStep = false;
    await step.save();
    return step;
  }

  async activerStep(id: string, activeStep: boolean) {
    const step: StepDocuments = await this.stepModel.findById(id);
    if (!step) {
      throw new HttpException(`el step con id: ${id} no existe`, 404);
    }
    if (step.activeStep === true) {
      throw new HttpException(`el step con id: ${id} ya esta activado`, 400);
    }
    step.activeStep = true;
    await step.save();
    return step;
  }

  async getStepByName(step: string): Promise<Step> {
    try {
      const stepData = this.stepModel.findOne({ step }).exec();
      if (!stepData) {
        throw new HttpException(
          `El step con nombre: ${stepData} no existe en la base de datos`,
          404,
        );
      }
      return stepData;
    } catch (error) {
      throw new HttpException(`Error en el servicio: ${error}`, 500);
    }
  }

  async filterParams(request: Request) {
    return this.stepModel
      .find(request.query)
      .sort({ nombre: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
  }
}
