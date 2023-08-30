import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

@Controller('template')
@ApiTags('template')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly httpService: HttpService,
  ) {}

  @Post()
  createTemplateCero(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templateService.create(createTemplateDto);
  }

  @Post('upload-template')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemplate(
    @UploadedFile() file: Express.Multer.File,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    const { fileTemplateDocx, nameTemplate } = createTemplateDto;
    const fileName = `${nameTemplate}.docx`;
    const datata = await this.templateService.createWithTemplateUse(
      createTemplateDto,
    );
    const filePath = path.join(process.cwd(), 'template', fileName);
    return datata;
  }

  @Get()
  async obtainAllTemplate() {
    return this.templateService.findAllIdDataBase();
  }

  @Get('fileNames')
  async listTemplate(@Res() res: Response) {
    return this.templateService.findAll(res);
  }

  @Get(':templateId/download')
  async downloadTemplateById(
    @Param('templateId') templateId: string,
    @Res() res: Response,
  ) {
    const documentData = await this.templateService.getDocumentData(templateId);

    const idFileTemplate = documentData.dataTemplate;
    const responseDataTemplate = await this.httpService
      .get(`${process.env.API_FILES_UPLOADER}/file/${idFileTemplate}`)
      .toPromise();

    const { mime, base64 } = responseDataTemplate.data.file;

    const base64Data = base64;
    const fileName = documentData.nameTemplate;

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(base64Data, 'base64'));
  }

  @Get(':fileName')
  async downloadTemplate(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const templatesDir = path.join(process.cwd(), 'template');
    const filePath = path.join(templatesDir, fileName);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('file not found');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templateService.update(+id, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templateService.remove(+id);
  }
}
