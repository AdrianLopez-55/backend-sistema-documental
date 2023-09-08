import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateDocumentDTO } from './createDocument.dto';

export class UpdateDocumentDTO extends PartialType(CreateDocumentDTO) {}
