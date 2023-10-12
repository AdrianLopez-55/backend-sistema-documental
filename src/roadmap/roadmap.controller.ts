import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
  Query,
} from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permission } from 'src/guard/constants/Permission';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { CreateAssignedDocumentDto } from './dto/createAssignedDocument.dto';
import { PaginationDto } from 'src/common/pagination.dto';

@Controller('roadmap')
@UseGuards(RolesGuard)
@ApiTags('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @ApiBody({
    type: CreateRoadmapDto,
    examples: {
      example: {
        value: {
          title: 'titulo',
          description: 'description',
          startData: '202-03-21',
          updateDate: '2023-05-20',
          objetives: ['objetive', 'objetive2'],
          funtionalities: [
            { name: 'name', priority: 'alta', state: 'en curso' },
          ],
          risks: [{ description: 'description', mitigation: 'mitigation' }],
          currentStatus: 'stirng',
          additionalNotes: 'string',
        },
      },
    },
  })
  @Post()
  create(@Body() createRoadmapDto: CreateRoadmapDto, @Req() req) {
    const tokenDat = req.token;
    return this.roadmapService.create(createRoadmapDto, tokenDat);
  }

  @Get()
  findAll() {
    return this.roadmapService.findAll();
  }

  @Get('pagination')
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  async findAllPaginate(@Query() paginationDto: PaginationDto, @Req() req) {
    return this.roadmapService.findAllPaginate(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roadmapService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRoadmapDto: UpdateRoadmapDto) {
    return this.roadmapService.update(id, updateRoadmapDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roadmapService.remove(id);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post('assignedDocument/:id')
  async addAssignedDocument(
    @Param('id') id: string,
    @Req() req,
    @Body() createAssignedDocumentDto: CreateAssignedDocumentDto,
  ) {
    const tokenDat = req.token;
    return this.roadmapService.addAssignedDocument(
      id,
      createAssignedDocumentDto,
      tokenDat,
    );
  }
}
