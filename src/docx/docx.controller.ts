import { Controller, Get, Res } from '@nestjs/common';
import { DocxService } from './docx.service';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';

@Controller('docx')
@ApiTags('Docx')
export class DocxController {
  constructor(private readonly docxService: DocxService) {}

  //   @Get()
  //   async createDocx(): Promise<string> {
  //     this.docxService.createDocx();
  //     return 'Document created...';
  //   }

  @Get()
  async createDocx(@Res() response: Response): Promise<void> {
    const docxArrayBuffer = await this.docxService.createDocx();

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    // response.setHeader(
    //   'Content-Disposition',
    //   'attachment; filename=myDocumento.docx',
    // );
    response.status(200).send(Buffer.from(docxArrayBuffer));
  }

  //   @Get('download')
  //   async downloadDocx(@Res() res: Response): Promise<void> {
  //     const filename = 'template.docx';

  //     res.setHeader(
  //       'Content-Type',
  //       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  //     );
  //     res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  //     const fileStream = fs.createReadStream(filename);
  //     fileStream.pipe(res);
  //   }
}
