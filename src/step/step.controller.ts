import { Controller, Post, Body, Get, Param, Query, Put, HttpException, Delete, Req, } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StepService } from './step.service';
import { StepDto } from './dto/step.dto';
import { Step } from './schemas/step.schema';
import { ParseObjectIdPipe } from 'src/utilities/parse-object-id-pipe.pipe';
import { PasoDto } from './dto/paso.dto';
import { Request, Response } from 'express';

@Controller('step')
@ApiTags('step')
export class StepController {
	constructor(private readonly stepsService: StepService) {}

	@ApiResponse({ status: 201, description: 'Step creado exitosamente' })
	@ApiBody({ type:StepDto, examples: {
		'example': {
			value: {
				step: 'step A',
				descriptionStep: 'a description',
				pasos: [
					{ paso: 1, oficina: 'oficina_A' },
					{ paso: 2, oficina: 'oficina_B' },
					{ paso: 3, oficina: 'oficina_C' },
					{ paso: 4, oficina: 'oficina_D' },
					{ paso: 5, oficina: 'oficina_E' },
				]
			}
		}
	} })
	@Post()
	@ApiOperation({ summary: 'create a new step' })
	async crearStep(@Body() stepDto: StepDto) {
	  return this.stepsService.crearStep(stepDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all steps' })
	async findAllSteps(){
		return this.stepsService.findAllSteps()
	}

	@Get('filter')
	@ApiOperation({ summary: 'Get records by parameter filtering', description: 'Search for records by filtering'})
	@ApiQuery({
		name: 'step',
		example: 'step A',
		required: false,
		description: 'search step by name'
	})
	async filterParam(
		@Query('step') step: string,
		@Req() request: Request,
	){
		return this.stepsService.filterParams(request)
	}

	@Get('active')
	@ApiOperation({ summary: 'see only steps actives' })
	async findStepActives():Promise<Step[]>{
		return this.stepsService.findAllstepsActive();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Obtain step by ID' })
	findOne(@Param('id', ParseObjectIdPipe) id: string) {
	  return this.stepsService.findOne(id);
	}

	@Get('step-name/:step')
	@ApiOperation({ summary: 'search document type by name' })
	async getStepByName(@Param('step') step: string){
		const stepName = this.stepsService.getStepByName(step);
		if(!stepName){
			throw new HttpException('El nombre del step no fue encontrado', 404)
		}
		return stepName;
	}


	@Put(':id')
	@ApiOperation({ summary: 'update step by ID' })
	@ApiBody({ type:StepDto, examples: {
		'example': {
			value: {
				step: 'step A',
				pasos: [
					{ paso: 1, oficina: 'oficina_A' },
					{ paso: 2, oficina: 'oficina_B' },
					{ paso: 3, oficina: 'oficina_C' },
					{ paso: 4, oficina: 'oficina_D' },
					{ paso: 5, oficina: 'oficina_E' },
				]
			}
		}
	} })
	update(
		@Param('id') id: string,
		@Body() stepDto: StepDto,
	){
		return this.stepsService.update(id, stepDto)
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Inactiver step by ID' })
	remove(@Param('id') id: string, activeStep: boolean){
		return this.stepsService.inactiverStep(
			id,
			activeStep,
		);
	}

	@Put(':id/activer')
	@ApiOperation({ summary: 'reactivate step by id' })
	activerStep(@Param('id') id: string, activeStep: boolean){
		return this.stepsService.activerStep(
			id,
			activeStep,
		);
	}
}
