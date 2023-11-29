import { Injectable, HttpException } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { InjectModel } from '@nestjs/mongoose';
import { File, FileDocument } from './schema/file.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';
import { SendHtmlBase64Dto } from './dto/sendHtmlBase64.dto';
import * as fs from 'fs';
import * as docxConverter from 'docx-pdf';
import puppeteer from 'puppeteer';
import {
  DocumentDocument,
  Documents,
} from 'src/documents/schema/documents.schema';
import { AddFileToDocumentDto } from './dto/addFileToDocumentDto.dto';

@Injectable()
export class FileService {
  private readonly apiFilesUploader = getConfig().api_files_uploader;
  private readonly apiFilesTemplate = getConfig().api_files_template;
  constructor(
    @InjectModel(File.name)
    private readonly fileModel: Model<FileDocument>,
    @InjectModel(Documents.name)
    private readonly documentsModel: Model<DocumentDocument>,
    private readonly httpService: HttpService,
  ) {}

  create(createFileDto: CreateFileDto) {
    return 'This action adds a new file';
  }

  async findAll() {
    return await this.fileModel.find().exec();
  }

  async findIdDocumentIdFiles(idDocument: string) {
    return await this.fileModel.findOne({ idDocument }).exec();
  }

  async findBase64OfDocument(idDocument: string, idFile: string) {
    const fileDocument = await this.fileModel.findOne({ idDocument }).exec();
    if (!fileDocument) {
      throw new HttpException('no se encotro el ID del documento', 400);
    }
    let documentBase64Files = [];
    // for (const idFile of fileDocument.fileRegister) {
    //   const infoBase64 = await this.httpService
    //     .get(`${this.apiFilesUploader}/file/${idFile}`)
    //     .toPromise();
    //   documentBase64Files.push(infoBase64.data.file.base64);
    // }
    const selectedFile = fileDocument.fileRegister.find(
      (file) => file.idFile === idFile,
    );
    if (!selectedFile) {
      throw new Error('Archivo no encontrado en el documento'); // Maneja el caso en el que no se encuentre el archivo
    }

    const infoBase64 = await this.httpService
      .get(`${this.apiFilesUploader}/file/${selectedFile.idFile}`)
      .toPromise();

    if (infoBase64.status !== 200) {
      throw new Error('No se pudo obtener el base64 para el archivo');
    }

    return infoBase64.data.file.base64;
  }

  async findOne(id: string) {
    return await this.fileModel.findById(id).exec();
  }

  update(id: string, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  async htmlConvertPdf(sendHtmlFileDto: SendHtmlBase64Dto) {
    const { htmlContent, nameFile, descriptionFile, base64File } =
      sendHtmlFileDto;
    if (htmlContent) {
      const mime = require('mime-types');
      // console.log(base64File.length);
      if (base64File.length > 0) {
        throw new HttpException(
          'solo puedes enviar o html o base64, no los dos al mismo tiempo',
          400,
        );
      }
      const browser = await puppeteer.launch({
        headless: 'new',
      });
      const page = await browser.newPage();

      await page.setContent(htmlContent);

      const pdfBuffer = await page.pdf({
        format: 'Letter',
        // format: pageSize,
        // printBackground: true,
      });

      await browser.close();

      const pdfBase64 = pdfBuffer.toString('base64');

      const mimeType = 'application/pdf';

      const fileObj = {
        mime: mimeType,
        base64: pdfBase64,
      };
      const response = await this.uploadFile(fileObj);
      const fileRegister = this.createFileRegister(response.data.file);

      const newFile = new this.fileModel({
        idDocument: null,
        fileRegister,
      });

      await newFile.save();

      return newFile;
    }
    //-----------------
    //si en base64 se envia como docx
    const prefixToCheck: string =
      'data:@file/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const base64s = [];

    for (const base64 of sendHtmlFileDto.base64File) {
      if (base64.startsWith('data')) {
        if (htmlContent) {
          throw new HttpException(
            'solo puedes enviar o html o base64, no los dos al mismo tiempo',
            400,
          );
        }
        const mimeType = base64.split(';')[0].split(':')[1];
        const base64Data = base64.split(',')[1];
        const fileObj = {
          mime: mimeType,
          base64: base64Data,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
        const newFile = new this.fileModel({
          idDocument: null,
          fileRegister,
        });
        await newFile.save();

        return newFile;
      } else if (base64.startsWith(prefixToCheck)) {
        if (htmlContent) {
          throw new HttpException(
            'solo puedes enviar o html o base64, no los dos al mismo tiempo',
            400,
          );
        }

        const mimeType = base64.split(';')[0].split(':')[1];
        const base64Data = base64.split(',')[1];

        const fileObj = {
          mime: mimeType,
          base64: base64Data,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
        const binaryData = Buffer.from(base64, 'base64');

        //definir ruta y nombre del archivo temporal
        const path = require('path');
        const tempFolder = path.join(process.cwd(), 'template');
        const fileName = `${nameFile}_file.docx`;
        const filePathTemplateDoc = path.join(tempFolder, fileName);
        fs.writeFileSync(filePathTemplateDoc, binaryData);
        //borrar el template descargado
        const timeToLiveInMillisencods = 1 * 60 * 1000;
        setTimeout(() => {
          fs.unlink(filePathTemplateDoc, (err) => {
            if (err) {
              console.error('error al eliminar file', err);
            } else {
              console.log('archivo eliminado', filePathTemplateDoc);
            }
          });
        }, timeToLiveInMillisencods);
        //convertir a pdf
        const inputPath = path.join(
          process.cwd(),
          'template',
          `${nameFile}_file.docx`,
        );
        const outPutDocumentTemplate = path.join(process.cwd(), 'template');
        const outPuthFileName = `${nameFile}_file.pdf`;
        const outPutPathTemplate = path.join(
          outPutDocumentTemplate,
          outPuthFileName,
        );
        await this.convertDocxToPdf(inputPath, outPutPathTemplate);
        const rutaPdfGenerated = path.join(
          process.cwd(),
          'template',
          `${nameFile}_file.pdf`,
        );
        const resultFile = fs.readFileSync(rutaPdfGenerated);
        const base64String = resultFile.toString('base64');
        const fileExtension = path.extname(`${nameFile}_file.pdf`).substring(1);
        const mimeTypePdf = `application/${fileExtension}`;
        const dataPdf = {
          mime: mimeTypePdf,
          base64: base64String,
        };
        const sentDataDocx = await this.httpService
          .post(`${this.apiFilesTemplate}/files/upload-template`, {
            templateName: `${nameFile}_file.pdf`,
            file: dataPdf,
          })
          .toPromise();

        const timeToLiveInMIlliseconds = 1 * 60 * 1000;
        setTimeout(() => {
          fs.unlink(rutaPdfGenerated, (err) => {
            if (err) {
              console.error('error al eliminar archivo temporal: ', err);
            } else {
              console.log('Archivo temporal eliminado: ', rutaPdfGenerated);
            }
          });
          fs.unlink(outPutPathTemplate, (err) => {
            if (err) {
              console.error('Error al eliminar archivo temporal PDF: ', err);
            } else {
              console.log(
                'Archivo temporal PDF eliminado: ',
                outPutPathTemplate,
              );
            }
          });
        }, timeToLiveInMIlliseconds);

        // return {
        //   nameFile: nameFile,
        //   descriptionFile: descriptionFile,
        //   pdfBase64: base64String,
        // };
        const newFile = new this.fileModel({
          idDocument: null,
          fileRegister,
        });
        await newFile.save();

        base64s.push(newFile);
      } else {
        //si se envia como pdf
        if (base64.startsWith('data:application/pdf')) {
          if (htmlContent) {
            throw new HttpException(
              'solo puedes enviar o html o base64, no los dos al mismo tiempo',
              400,
            );
          }
          // const { mime, base64 } = this.extractFileData(base64File);
          const mimeType = base64.split(';')[0].split(':')[1];
          const base64Data = base64.split(',')[1];
          const fileObj = {
            mime: mimeType,
            base64: base64Data,
          };
          const response = await this.uploadFile(fileObj);
          const fileRegister = this.createFileRegister(response.data.file);
          // return {
          //   nameFile: nameFile,
          //   descriptionFile: descriptionFile,
          //   pdfBase64: base64,
          // };
          const newFile = new this.fileModel({
            idDocument: null,
            fileRegister,
          });
          await newFile.save();
          base64s.push(newFile);
        }
      }
    }
    return base64s;
  }

  // async addFileToDocment(id: string, idDocument: string) {
  //   const findFile = await this.fileModel.findById(id).exec();
  //   const document = await this.documentsModel.findById(idDocument).exec();
  //   if (!idDocument) {
  //     throw new HttpException('el documento no pudo ser encontrado', 400);
  //   }
  //   if (!document.fileRegister) {
  //     document.fileRegister = findFile.fileRegister;
  //     await document.save();
  //     findFile.idDocument = document._id;
  //     await findFile.save();
  //     return findFile;
  //   }
  // }

  async addFileToDocumentExist(
    idDocument: string,
    addFileToDocumentDto: AddFileToDocumentDto,
  ) {
    const findDocument = await this.fileModel.findOne({ idDocument }).exec();
    const findDocumentOffcie = await this.documentsModel
      .findById(idDocument)
      .exec();
    const fileDataArray = await this.extractFileData(addFileToDocumentDto.file);
    let fileRegisterData = [];
    // fileRegisterData.push(findDocument.fileRegister);
    for (const fileData of fileDataArray) {
      const { mime, base64 } = fileData;
      console.log('esto es mime', mime);
      console.log('esto es base64', base64);
      if (
        mime.startsWith(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
      ) {
        const binaryData = Buffer.from(base64, 'base64');

        //definir ruta y nombre del archivo temporal
        const path = require('path');
        const tempFolder = path.join(process.cwd(), 'template');
        const fileName = `_file.docx`;
        const filePathTemplateDoc = path.join(tempFolder, fileName);
        fs.writeFileSync(filePathTemplateDoc, binaryData);
        //borrar el template descargado
        const timeToLiveInMillisencods = 1 * 60 * 1000;
        setTimeout(() => {
          fs.unlink(filePathTemplateDoc, (err) => {
            if (err) {
              console.error('error al eliminar file', err);
            } else {
              console.log('archivo eliminado', filePathTemplateDoc);
            }
          });
        }, timeToLiveInMillisencods);
        //convertir a pdf
        const inputPath = path.join(process.cwd(), 'template', `_file.docx`);
        const outPutDocumentTemplate = path.join(process.cwd(), 'template');
        const outPuthFileName = `_file.pdf`;
        const outPutPathTemplate = path.join(
          outPutDocumentTemplate,
          outPuthFileName,
        );
        await this.convertDocxToPdf(inputPath, outPutPathTemplate);
        const rutaPdfGenerated = path.join(
          process.cwd(),
          'template',
          `_file.pdf`,
        );
        const resultFile = fs.readFileSync(rutaPdfGenerated);
        const base64String = resultFile.toString('base64');
        const fileObj = {
          mime: 'application/pdf',
          base64: base64String,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
        // fileRegisterData.push(fileRegister);
        findDocument.fileRegister.push(fileRegister);
      } else {
        console.log(mime);
        const fileObj = {
          mime: mime,
          base64: base64,
        };
        const response = await this.uploadFile(fileObj);
        const fileRegister = this.createFileRegister(response.data.file);
        // fileRegisterData.push(fileRegister);
        findDocument.fileRegister.push(fileRegister);
        console.log(findDocument);
      }
      const fileObj = {
        mime: mime,
        base64: base64,
      };
      // const response = await this.uploadFile(fileObj);
      // const fileRegister = this.createFileRegister(response.data.file);
      // findDocument.fileRegister.push(fileRegister);
    }
    await findDocument.save();
    findDocumentOffcie.fileRegister = findDocument.fileRegister;
    await findDocumentOffcie.save();
    console.log('new fileregister', findDocument);
    // console.log('fileregisterdata de documento push', fileRegisterData);
    // findDocument.fileRegister = fileRegisterData;
    // await findDocument.save();
    return findDocument;
  }

  async getAllBase64(idDocument: string) {
    const fileDocument = await this.fileModel.findOne({ idDocument }).exec();
    const base64Array: string[] = [];
    for (const fileEntry of fileDocument.fileRegister) {
      const base64 = await this.findBase64OfDocument(
        idDocument,
        fileEntry.idFile,
      );
      if (base64) {
        base64Array.push(base64);
      }
    }
    return base64Array;
  }

  private extractFileData(file: string[]): { mime: string; base64: string }[] {
    const fileDataArray: { mime: string; base64: string }[] = [];
    for (const files of file) {
      const mimeType = files.split(';')[0].split(':')[1];
      const base64 = files.split(',')[1];
      fileDataArray.push({ mime: mimeType, base64 });
    }
    return fileDataArray;
  }

  async remove(id: string) {
    return await this.fileModel.findByIdAndRemove(id).exec();
  }

  private async uploadFile(fileObj: {
    mime: string;
    base64: string;
  }): Promise<any> {
    return this.httpService
      .post(`${this.apiFilesUploader}/files/upload`, { file: fileObj })
      .toPromise();
  }

  private createFileRegister(fileData: any): any {
    const { _id } = fileData;
    return {
      idFile: _id,
    };
  }

  private async convertDocxToPdf(inputPath: Buffer, outputPath: Buffer) {
    return new Promise<string>((resolve, reject) => {
      docxConverter(inputPath, outputPath, (err: any, result: string) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log('Result: ' + result);
          resolve(result);
        }
      });
    });
  }

  async updateFileContent(idDocument: string, idFile: string) {
    const fileDocument = await this.fileModel.findOne({ idDocument }).exec();
    if (!fileDocument) {
      throw new HttpException('no se encotro el ID del documento', 400);
    }
    let documentBase64Files = [];
    // for (const idFile of fileDocument.fileRegister) {
    //   const infoBase64 = await this.httpService
    //     .get(`${this.apiFilesUploader}/file/${idFile}`)
    //     .toPromise();
    //   documentBase64Files.push(infoBase64.data.file.base64);
    // }
    const selectedFile = fileDocument.fileRegister.find(
      (file) => file.idFile === idFile,
    );
    if (!selectedFile) {
      throw new Error('Archivo no encontrado en el documento'); // Maneja el caso en el que no se encuentre el archivo
    }

    const infoBase64 = await this.httpService
      .get(`${this.apiFilesUploader}/file/${selectedFile.idFile}`)
      .toPromise();

    if (infoBase64.status !== 200) {
      throw new Error('No se pudo obtener el base64 para el archivo');
    }

    return infoBase64.data.file.base64;
  }
}
