import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schema/file.schema';
import { HttpModule } from '@nestjs/axios';
import {
  Documents,
  DocumentsSchema,
} from 'src/documents/schema/documents.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Documents.name, schema: DocumentsSchema },
    ]),
    HttpModule,
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
