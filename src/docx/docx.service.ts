import { HttpException, Injectable } from '@nestjs/common';
import * as docx from 'docx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';

import { TemplateHandler } from 'easy-template-x';
// import path, { join } from 'path';
import * as path from 'path';

@Injectable()
export class DocxService {
  async createDocx(): Promise<ArrayBuffer> {
    const documentData = {
      documentationTypeTag: '{documentationTypeTag }',
      numberDocumentTag: '{numberDocumentTag}',
      title: '{title}',
      descriptionTag: '{descriptionTag}',
    };

    const doc = new docx.Document({
      sections: [
        {
          //   properties: {},
          children: [
            new Paragraph({
              text: documentData.documentationTypeTag,
              alignment: docx.AlignmentType.CENTER,
              heading: docx.HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: '---------------------------------------------',
            }),

            new Paragraph(
              `Número de documento: ${documentData.numberDocumentTag}`,
            ),
            new Paragraph(`Referencia del documento: ${documentData.title}`),
            new Paragraph(
              `Tipo de documento: ${documentData.documentationTypeTag}`,
            ),
            new Paragraph('----------------------------------------'),
            new Paragraph('Contenido:'),
            new Paragraph(documentData.descriptionTag),
          ],
        },
      ],
    });

    const templateDirectory = path.join(process.cwd(), 'template');
    if (!fs.existsSync(templateDirectory)) {
      fs.mkdirSync(templateDirectory);
    }
    const filePath = path.join(templateDirectory, 'fileName');
    const buffer = await Packer.toBuffer(doc);
    // fs.writeFileSync(filePath, buffer);

    // const dataUri = await fileToDataUri(filePath);
    // if(!fileName){
    //   throw new HttpException('no ay nombre', 400)
    // }
    // if(!DataUri){
    //   throw new HttpException('no hay id de archivo', 400)
    // }

    Packer.toBuffer(doc).then((buffer) => {
      fs.writeFileSync(filePath, buffer);
      console.log('documento creado en el directorio exitosamente');
    });
    return Packer.toBuffer(doc);
  }
}
