import { PartialType } from '@nestjs/swagger';
import { CreateStateDocumentDto } from './create-state-document.dto';

export class UpdateStateDocumentDto extends PartialType(CreateStateDocumentDto) {}
