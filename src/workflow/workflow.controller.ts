import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Query,
  ForbiddenException,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { WorkflowDto } from './dto/createWorkflow.dto';
import { StepService } from 'src/step/step.service';
import { ParseObjectIdPipe } from 'src/utilities/parse-object-id-pipe.pipe';
import { Workflow } from './schemas/workflow.schema';
import { Request, Response } from 'express';
import { WorkflowFilter } from './dto/workfowFilter.dto';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { UpdatePasoWorkflowDto } from './dto/updatePasoWorkflow.dto';

@Controller('workflow')
// @UseGuards(RolesGuard)
@ApiTags('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @ApiResponse({ status: 201, description: 'Workflow creado exitosamente' })
  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  async create(@Body() workflowDto: WorkflowDto) {
    return this.workflowService.createWorkflow(workflowDto);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'find all workflow in the database' })
  async findAll() {
    return this.workflowService.findAll();
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('filtrado')
  @ApiOperation({
    summary: 'Get records by parameter filtering',
    description: 'Search for records by filtering',
  })
  async filterParam(@Query() filter: WorkflowFilter) {
    return await this.workflowService.filterParams(filter);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('active')
  @ApiOperation({ summary: 'find all workflow active in the database' })
  async findWorkflowActives(): Promise<Workflow[]> {
    return this.workflowService.getWorkflowActive();
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('inactive')
  @ApiOperation({ summary: 'find all workflow inactive' })
  async findWorkflowINactive(): Promise<Workflow[]> {
    return this.workflowService.getWorkflowInactive();
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Obtain workflow by ID' })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    activeWorflow: boolean,
  ) {
    try {
      const workflow = await this.workflowService.findOne(id);
      if (!workflow) {
        throw new HttpException('workflow no encontrado', 404);
      }
      if (!workflow.activeWorkflow) {
        throw new HttpException('workflow inactivo', 404);
      }
      return this.workflowService.findOne(id);
    } catch (error) {
      throw new error();
    }
  }

  @Get('workflow/:nombre')
  @ApiOperation({ summary: 'find workflow by name' })
  async getDocumentTypeByName(@Param('nombre') nombre: string) {
    const nombreWorkflow = await this.workflowService.getWorkflowByName(nombre);
    return nombreWorkflow;
  }

  @Get('versions/:id/:version')
  @ApiOperation({ summary: 'show the varsion a choise from documento' })
  async getDocumentVersion(
    @Param('id') id: string,
    @Param('version') version: number,
  ): Promise<Workflow> {
    return this.workflowService.getDocumentVersion(id, version);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update workflow by ID' })
  async updateWorkflow(
    @Param('id') id: string,
    @Body() workflowDto: WorkflowDto,
  ) {
    return this.workflowService.update(id, workflowDto);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Inactiver workflow by ID' })
  remove(@Param('id') id: string, activeWorkflow: boolean) {
    return this.workflowService.inactiverWorkflow(id, activeWorkflow);
  }

  // @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Put('activer/:id')
  @ApiOperation({ summary: 'Activer workflow by ID' })
  activerWorkflow(@Param('id') id: string, activeWorflow: boolean) {
    return this.workflowService.activerWorkflow(id, activeWorflow);
  }
}
