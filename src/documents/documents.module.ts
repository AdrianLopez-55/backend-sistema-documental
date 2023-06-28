import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { MongooseModule } from '@nestjs/mongoose'
import { Documents, DocumentsSchema } from './schema/documents.schema';
import { SequenceService } from './sequenceService.service';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  imports: [MongooseModule.forFeature([
    {name: Documents.name, schema: DocumentsSchema}
  ]), HttpModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, SequenceService]
})
export class DocumentsModule {}
