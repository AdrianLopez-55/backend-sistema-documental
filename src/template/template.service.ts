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

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocuments>,
    private readonly httpService: HttpService,
  ) {}

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
}
