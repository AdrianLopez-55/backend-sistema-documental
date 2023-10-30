import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import * as fs from 'fs';
import { SendHtmlBase64Dto } from './dto/sendHtmlBase64.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('file')
@ApiTags('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  create(@Body() createFileDto: CreateFileDto) {
    return this.fileService.create(createFileDto);
  }

  @Get()
  findAll() {
    return this.fileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileService.findOne(id);
  }

  @Get('document-files/:idDocument')
  async documentFiles(@Param('idDocument') idDocument: string) {
    return await this.fileService.findIdDocumentIdFiles(idDocument);
  }

  @Get('base64-document-files/:idDocument/:idFile')
  async base64DocumentFiles(
    @Param('idDocument') idDocumet: string,
    @Param('idFile') idFile: string,
  ) {
    return await this.fileService.findBase64OfDocument(idDocumet, idFile);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.fileService.update(id, updateFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileService.remove(id);
  }

  @Post('generate-pdf')
  // @ApiBody({ description: 'Contenido HTML' })
  async generatePdf(
    @Body() sendHtmlFileDto: SendHtmlBase64Dto,
    // @Res() res: Response,
  ) {
    const pdfBase64 = await this.fileService.htmlConvertPdf(sendHtmlFileDto);
    // const binaryData = Buffer.from(pdfBase64.pdfBase64, 'base64');

    // const path = require('path');
    // const tempFolder = path.join(process.cwd(), 'template');
    // const fileName = `${pdfBase64.nameFile}.pdf`;
    // const filePathPdf = path.join(tempFolder, fileName);
    // fs.writeFileSync(filePathPdf, binaryData);

    // const timeToLiveInMilliseconds = 1 * 60 * 1000;
    // setTimeout(() => {
    //   fs.unlink(filePathPdf, (err) => {
    //     if (err) {
    //       console.error('error al eliminar el pdf: ', err);
    //     } else {
    //       console.log('Archivo pdf eliminado');
    //     }
    //   });
    // }, timeToLiveInMilliseconds);

    //descarcarg el pdf
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    // const fileStream = fs.createReadStream(filePathPdf);
    // fileStream.pipe(res);
    return pdfBase64;
  }

  @Post('add-file-to-document/:idFile/:idDocument')
  async addFileToDocument(
    @Param('idFile') IdFile: string,
    @Param('idDocument') idDocument: string,
  ) {
    return await this.fileService.addFileToDocment(IdFile, idDocument);
  }

  // @Post('addFile')
}
