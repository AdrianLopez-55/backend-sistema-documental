import { Module } from '@nestjs/common';
import { DocumentationTypeService } from './documentation-type.service';
import { DocumentationTypeController } from './documentation-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DocumentationType,
  DocumentationTypeSchema,
} from './schema/documentation-type.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentationType.name, schema: DocumentationTypeSchema },
    ]),
    HttpModule,
  ],
  controllers: [DocumentationTypeController],
  providers: [DocumentationTypeService],
})
export class DocumentationTypeModule {}
