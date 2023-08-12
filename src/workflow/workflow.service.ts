import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workflow, WorkflowDocuments } from './schemas/workflow.schema';
import { Model } from 'mongoose';
import { WorkflowDto } from './dto/createWorkflow.dto';
import { Step, StepDocuments } from 'src/step/schemas/step.schema';
import { ErrorManager } from 'src/documentation-type/error.interceptor';
import { Request } from 'express'
import { WorkflowFilter } from './dto/workfowFilter.dto';

@Injectable()
export class WorkflowService {
	constructor(
		@InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocuments>,
		@InjectModel(Step.name) private readonly stepModel: Model<StepDocuments>,
		
	){}

	async createWorkflow(workflowDto: WorkflowDto): Promise<any>{
		const { nombre, descriptionWorkflow, stepName,  } = workflowDto;
		const step = await this.stepModel.findOne({ step: stepName });
		if (!step) {
			throw new NotFoundException(`Paso "${stepName}" no encontrado`);
		}

		const existingWorkflow = await this.workflowModel
		.findOne({ nombre })
		.exec();
		if(existingWorkflow){
			throw new HttpException(`El nombre ${existingWorkflow} ya existe.`, 400);
		}
		
		const nuevoWorkflow = new this.workflowModel({
			nombre: nombre,
			descriptionWorkflow: descriptionWorkflow,
			steps: [step], 
			oficinaActual: 'aun no se envio a ninguna oficina para su seguimiento'
		});

		return nuevoWorkflow.save()
	}

	async findAll(): Promise<Workflow[]>{
		return this.workflowModel
		.find()
		.sort({ nombre: 1 })
		.exec();
	}

	// async marcarSiguientePasoCompletado(id: string): Promise<Workflow> {
	// 	const workflow = await this.workflowModel.findById(id);
	  
	// 	if (!workflow) {
	// 	  throw new NotFoundException(`Workflow con ID "${id}" no encontrado`);
	// 	}

	// 	const pasoActual = workflow.pasoActual;
	  
	// 	if (pasoActual >= workflow.steps[0][0].pasos.length) {
	// 	  throw new BadRequestException('Todos los pasos ya están completados');
	// 	}
	  
	// 	workflow.steps[0][0].pasos[pasoActual].completado = true;
	// 	workflow.pasoActual = pasoActual + 1;
	// 	workflow.oficinaActual = workflow.steps[0][0].pasos[pasoActual].oficina

	// 	workflow.steps[0][0].pasoActual = pasoActual;

	// 	await workflow.save();
	  
	// 	return workflow;
	// }

	// async seleccionarNuevoPasoAnterior(id: string, numberPaso: number): Promise<Workflow>{
	// const workflow = await this.workflowModel.findById(id);
	// if (!workflow) {
	// 	throw new NotFoundException(`Workflow con ID "${id}" no encontrado`);
	// }
	// const pasoActual = workflow.pasoActual;
	
	// workflow.pasoActual = numberPaso;
	// const cantidadPasos = workflow.steps[0][0].pasos.length;
	// if(workflow.pasoActual > cantidadPasos){
	// 	throw new BadRequestException('el paso no existe')
	// }
	// // Restablecer el estado completado de los pasos posteriores
	// for (let i = pasoActual + 1; i < workflow.steps[0][0].pasos.length; i++) {
	// 	console.log('que paso')
    //   	workflow.steps[0][0].pasos[i].completado = false;
	// }
	// if(numberPaso){
	// 	const pasos = workflow.steps[0][0].pasos;
	// 	for (let i = numberPaso; i < pasos.length; i++) {
	// 		pasos[i].completado = false;
	// 	}
	// }
	// return workflow.save()
	// }

	async getWorkflowByName(
	nombre: string,
	): Promise<Workflow> {
		try {
			const nombreWorkflow = this.workflowModel
	  		.findOne({ nombre })
	  		.exec();
			return nombreWorkflow;
		} catch (error) {
			throw new error
		}
	}

	async findOne(id: string): Promise<Workflow> {
		const workflow = await this.workflowModel
		.findById({ _id: id })
		.exec();
		return workflow;
	  }

	async getWorkflowActive():Promise<Workflow[]>{
		const workflowDatas = await this.workflowModel.find({ activeWorkflow: true }).exec();
		return workflowDatas.sort((a,b) => a.nombre.localeCompare(b.nombre));
	}

	async update(id: string, workflowDto: WorkflowDto):Promise<any>{
		const existingWorkflow = await this.workflowModel.findById(id).exec();
		if (!existingWorkflow) {
  		  throw new NotFoundException(`Workflow con ID "${id}" no encontrado`);
  		}
		if(existingWorkflow.activeWorkflow === false){
			throw new HttpException('el workflow fue borrado', 404)
		}

		const { nombre, descriptionWorkflow, stepName } = workflowDto;
		if(nombre !== undefined && nombre !== ""){
			existingWorkflow.nombre = nombre
		}
		if(descriptionWorkflow !== undefined && descriptionWorkflow !== ""){
			existingWorkflow.descriptionWorkflow = descriptionWorkflow
		}

  		const step = await this.stepModel.findOne({ step: stepName });
  		if (!step) {
  		  throw new NotFoundException(`Paso "${stepName}" no encontrado`);
  		}
		if(stepName !== undefined && stepName !== ""){
			existingWorkflow.steps = [step]
		}
	
  		const updatedWorkflow = await existingWorkflow.save();
  		return updatedWorkflow;
	}

	async inactiverWorkflow(id: string, activeWorkflow: boolean){
		const workflowData: WorkflowDocuments = 
		await this.workflowModel.findById(id);
		workflowData.activeWorkflow = false;
		await workflowData.save();
		return workflowData
	}

	async activerWorkflow(id:string, activeWorkflow: boolean){
		const workflowData: WorkflowDocuments =
		await this.workflowModel.findById(id);
		workflowData.activeWorkflow = true;
		await workflowData.save();
		return workflowData;
	}

	async filterParams(filter: WorkflowFilter){
		const query = {};
		if (filter.nombre) {
		  query['nombre'] = filter.nombre;
		}
		if(filter.step){
			query['steps[0][0].step'] = filter.step;
		}
		const filteredWorkflow = await this.workflowModel.find(query).exec();
		return filteredWorkflow
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
