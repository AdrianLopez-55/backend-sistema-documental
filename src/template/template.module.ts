import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './schemas/template.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
    ]),
    HttpModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
