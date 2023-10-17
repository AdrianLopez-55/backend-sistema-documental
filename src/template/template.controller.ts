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
  Put,
  Query,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { TemplateFilter } from './dto/template-filter';
import { SendDocxBase64Dto } from './dto/sendDocxBase64.dto';

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

  @Get()
  async findAllTemplate() {
    return this.templateService.findAll();
  }

  @Get('filtered')
  async filteredParam(@Query() filter: TemplateFilter) {
    return await this.templateService.filterParams(filter);
  }

  @Get('template-preview/:id')
  async templatePreview(@Param('id') id: string) {
    return await this.templateService.templatePreview(id);
  }

  @Get('find-base64/:id')
  async findBase64Template(@Param('id') id: string) {
    return this.templateService.getBase64Template(id);
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templateService.updateTemplate(id, updateTemplateDto);
  }

  @Post('base64-docx')
  async base64Docx(@Body() sendDocxBase64Dto: SendDocxBase64Dto) {
    return this.templateService.uploadFileTemplateDocx(sendDocxBase64Dto);
  }

  // @Post('upload-template')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadTemplate(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() createTemplateDto: CreateTemplateDto,
  // ) {
  //   const { fileTemplateDocx, nameTemplate } = createTemplateDto;
  //   const fileName = `${nameTemplate}.docx`;
  //   const datata = await this.templateService.createWithTemplateUse(
  //     createTemplateDto,
  //   );
  //   const filePath = path.join(process.cwd(), 'template', fileName);
  //   return datata;
  // }

  // @Get()
  // async obtainAllTemplate() {
  //   return this.templateService.findAllIdDataBase();
  // }

  // @Get('fileNames')
  // async listTemplate(@Res() res: Response) {
  //   return this.templateService.findAll(res);
  // }

  // @Get(':templateId/download')
  // async downloadTemplateById(
  //   @Param('templateId') templateId: string,
  //   @Res() res: Response,
  // ) {
  //   const documentData = await this.templateService.getDocumentData(templateId);

  //   const idFileTemplate = documentData.dataTemplate;
  //   const responseDataTemplate = await this.httpService
  //     .get(`${process.env.API_FILES_UPLOADER}/file/${idFileTemplate}`)
  //     .toPromise();

  //   const { mime, base64 } = responseDataTemplate.data.file;

  //   const base64Data = base64;
  //   const fileName = documentData.nameTemplate;

  //   res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  //   res.setHeader('Content-Type', 'application/octet-stream');
  //   res.send(Buffer.from(base64Data, 'base64'));
  // }

  // @Get(':fileName')
  // async downloadTemplate(
  //   @Param('fileName') fileName: string,
  //   @Res() res: Response,
  // ) {
  //   const templatesDir = path.join(process.cwd(), 'template');
  //   const filePath = path.join(templatesDir, fileName);
  //   if (fs.existsSync(filePath)) {
  //     res.download(filePath);
  //   } else {
  //     res.status(404).send('file not found');
  //   }
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.templateService.findOne(+id);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateTemplateDto: UpdateTemplateDto,
  // ) {
  //   return this.templateService.update(+id, updateTemplateDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.templateService.remove(+id);
  // }
}
