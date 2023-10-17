import { HttpException, Injectable, Res } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import * as docx from 'docx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';
import { template } from 'handlebars';
import * as path from 'path';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Template, TemplateDocuments } from './schemas/template.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import puppeteer from 'puppeteer';
import * as mimeTypes from 'mime-types';
import getConfig from '../config/configuration';
import { TemplateFilter } from './dto/template-filter';
import { SendDocxBase64Dto } from './dto/sendDocxBase64.dto';
// import HTMLtoDOCX from 'html-to-docx';

@Injectable()
export class TemplateService {
  private readonly apiFilesTemplate = getConfig().api_files_template;
  private readonly apiFilesUploader = getConfig().api_files_uploader;
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocuments>,
    private readonly httpService: HttpService,
  ) {}

  async create(createTemplateDto: CreateTemplateDto) {
    const findName = await this.templateModel
      .findOne({ nameTemplate: createTemplateDto.nameTemplate })
      .exec();
    if (findName) {
      throw new HttpException('nombre de template ya en uso', 400);
    }

    // DESDE AQUI SE CREA EL DOCX DEL TEMPLATE
    const HTMLtoDOCX = require('html-to-docx');
    const { nameTemplate, descriptionTemplate, htmlContent } =
      createTemplateDto;

    //--convertir html a pdf usando puppeteer
    // const browser = await puppeteer.launch({
    //   headless: 'new',
    // });
    // const page = await browser.newPage();
    // await page.setContent(htmlContent);
    // const pdfBuffer = await page.pdf({
    //   format: 'Letter',
    // });
    // await browser.close();
    // const pdfBase64 = pdfBuffer.toString('base64');
    // const mimeType = mimeTypes.lookup('pdf');
    //subir el archi{vo al servicio pdf
    // const fileObj = {
    //   mime: mimeType,
    //   base64: pdfBase64,
    // };
    // const filePdf = await this.httpService
    //   .post(`${this.apiFilesTemplate}/files/upload-template`, {
    //     templateName: nameTemplate,
    //     file: fileObj,
    //   })
    //   .toPromise();
    // const newTemplate = new this.templateModel({
    //   nameTemplate: nameTemplate,
    //   descriptionTemplate: descriptionTemplate,
    //   idTemplate: filePdf.data.file._id,
    // });

    //convertir html a docx:
    const fileBuffer = await HTMLtoDOCX(
      htmlContent,
      null,
      {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      },
      true,
    );

    //guardar el archivo docx en template
    const templateDir = path.join(process.cwd(), 'template');
    const filePath = path.join(
      templateDir,
      `${nameTemplate.toUpperCase()}.docx`,
    );
    fs.writeFileSync(filePath, fileBuffer);

    //obtener mime del docx
    // const mimeTypeDocx = mimeTypes.lookup('.docx');
    const fileExtension = path.extname(filePath).substring(1);
    const mimeTypeDocx = `application/${fileExtension}`;

    //obtener la base64 de docx
    const docxBase64 = fileBuffer.toString('base64');

    const fileObj = {
      mime: mimeTypeDocx,
      base64: docxBase64,
    };

    const fileDocx = await this.httpService
      .post(`${this.apiFilesTemplate}/files/upload-template`, {
        templateName: nameTemplate,
        file: fileObj,
      })
      .toPromise();

    // crear el template
    const newTemplate = new this.templateModel({
      nameTemplate: nameTemplate,
      descriptionTemplate: descriptionTemplate,
      htmlTemplate: htmlContent,
      idTemplate: fileDocx.data.file._id,
    });

    await newTemplate.save();
    return newTemplate;
  }

  async templatePreview(id: string) {
    const template = await this.templateModel.findById(id).exec();
    return {
      nameTemplate: template.nameTemplate,
      htmlTemplate: template.htmlTemplate,
    };
  }

  async uploadFileTemplateDocx(sendDocxBase64Dto: SendDocxBase64Dto) {
    const { base64Docx, descriptionTemplate, nameTemplate } = sendDocxBase64Dto;
    if (base64Docx) {
      const { mime, base64 } = this.extractFileData(base64Docx);
      const fileObj = {
        mime: mime,
        base64: base64,
      };

      const fileDocx = await this.httpService
        .post(`${this.apiFilesTemplate}/files/upload-template`, {
          templateName: nameTemplate,
          file: fileObj,
        })
        .toPromise();
      const newTemplate = new this.templateModel({
        nameTemplate: nameTemplate,
        descriptionTemplate: descriptionTemplate,
        idTemplate: fileDocx.data.file._id,
      });
      return await newTemplate.save();
    }
  }

  async findAll() {
    const templates = await this.templateModel.find().exec();
    return templates;
  }

  async getBase64Template(id: string) {
    const template = await this.templateModel.findById(id).exec();
    const fileInfo = await this.httpService
      .get(`${this.apiFilesTemplate}/file/template/${template.idTemplate}`)
      .toPromise();
    return {
      idTemplate: template._id,
      nameTemplate: template.nameTemplate,
      base64Template: fileInfo.data.file.base64,
    };
  }

  async updateTemplate(id: string, updateTemplateDto: UpdateTemplateDto) {
    const HTMLtoDOCX = require('html-to-docx');
    const template = await this.templateModel
      .findByIdAndUpdate(id, updateTemplateDto, { new: true })
      .exec();

    if (updateTemplateDto.htmlContent) {
      //convertir html a docx:
      const fileBuffer = await HTMLtoDOCX(updateTemplateDto.htmlContent, true, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      //guardar el archivo docx en template
      const templateDir = path.join(process.cwd(), 'template');
      const filePath = path.join(
        templateDir,
        `${updateTemplateDto.nameTemplate.toUpperCase()}.docx`,
      );
      fs.writeFileSync(filePath, fileBuffer);

      //obtener mime del docx
      // const mimeTypeDocx = mimeTypes.lookup('.docx');
      const fileExtension = path.extname(filePath).substring(1);
      const mimeTypeDocx = `application/${fileExtension}`;

      //obtener la base64 de docx
      const docxBase64 = fileBuffer.toString('base64');

      const fileObj = {
        mime: mimeTypeDocx,
        base64: docxBase64,
      };

      const fileDocx = await this.httpService
        .post(`${this.apiFilesTemplate}/files/upload-template`, {
          templateName: updateTemplateDto.nameTemplate,
          file: fileObj,
        })
        .toPromise();
      template.idTemplate = fileDocx.data.file._id;
      template.htmlTemplate = updateTemplateDto.htmlContent;
    }
    return await template.save();
  }

  async filterParams(filter: TemplateFilter): Promise<Template[]> {
    const query: any = {};
    if (filter.nameTemplate) {
      query.nameTemplate = filter.nameTemplate;
    }
    const filteredTemplate = await this.templateModel.find(query).exec();
    return filteredTemplate;
  }

  //--FUNCION PARA OBTENER EL MIME Y EL BASE64 DE UN FILE
  private extractFileData(base64Docx: string): {
    mime: string;
    base64: string;
  } {
    const mimeType = base64Docx.split(';')[0].split(':')[1];
    const base64 = base64Docx.split(',')[1];
    return { mime: mimeType, base64 };
  }

  /*
  async create(createTemplateDto: CreateTemplateDto): Promise<any> {
    const { nameTemplate } = createTemplateDto;
    // const timestam = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${nameTemplate}.docx`;
    const docx = require('docx');

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun('Hello world'),
                new TextRun({
                  text: 'Foo Bar -- two',
                  bold: false,
                }),
                new TextRun({
                  text: 'i so cool',
                  bold: false,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const templateDirectory = path.join(process.cwd(), 'template');
    if (!fs.existsSync(templateDirectory)) {
      fs.mkdirSync(templateDirectory);
    }
    const filePath = path.join(templateDirectory, fileName);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    const dataUri = await this.fileToDataUri(filePath);
    console.log(fileName);
    console.log(dataUri._idFile);
    if (!fileName) {
      throw new HttpException('no hay nombre', 400);
    }

    if (!dataUri) {
      throw new HttpException('no hay id de archivo', 404);
    }

    const newTemplate = new this.templateModel({
      nameTemplate: fileName,
      dataTemplate: dataUri._idFile,
    });

    try {
      const savedTemplate = await newTemplate.save();
      return savedTemplate;
    } catch (error) {
      console.log('error saving template', error);
      throw new Error('error saving template');
    }
  }

  async createWithTemplateUse(
    createTemplateDto: CreateTemplateDto,
  ): Promise<Template> {
    const { nameTemplate } = createTemplateDto;
    const newTemplate = new this.templateModel({
      nameTemplate,
      dataTemplate: 'data',
    });
    return newTemplate;

    // const { nameTemplate, fileTemplateDocx } = createTemplateDto;
    // const mimeType = fileTemplateDocx.split(';')[1];
    // const base64 = fileTemplateDocx.split(',')[1];
    // const fileObj = {
    //   mime: mimeType,
    //   base64: base64,
    // };
    // const responseFile = await this.httpService
    //   .post(`${process.env.API_FILES_UPLOADER}/files/upload`, { file: fileObj })
    //   .toPromise();
    // const { _id } = responseFile.data.file;
    // const fileRegister = {
    //   _idFile: _id,
    // };

    // const fileName = `${nameTemplate}.docx`;
  }

  async getDocumentData(templateId: string): Promise<TemplateDocuments> {
    return this.templateModel.findById(templateId).exec();
  }

  findAll(@Res() res: Response) {
    const templatesDir = path.join(process.cwd(), 'template');
    const files = fs.readdirSync(templatesDir);
    res.json(files);
  }

  findAllIdDataBase() {
    return this.templateModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} template`;
  }

  update(id: number, updateTemplateDto: UpdateTemplateDto) {
    return `This action updates a #${id} template`;
  }

  remove(id: number) {
    return `This action removes a #${id} template`;
  }

  async fileToDataUri(filePath: string) {
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    const fileExtension = path.extname(filePath).substring(1);
    const mimeType = `application/${fileExtension}`;

    const fileObj = {
      mime: mimeType,
      base64: base64Data,
    };

    const response = await this.httpService
      .post(`${process.env.API_FILES_UPLOADER}/files/upload`, { file: fileObj })
      .toPromise();
    const { _id } = response.data.file;
    const fileRegister = {
      _idFile: _id,
    };
    return fileRegister;
  }

  */
}
