import { PartialType } from '@nestjs/swagger';
import { CreateDocumentationTypeDto } from './create-documentation-type.dto';

export class UpdateDocumentationTypeDto extends PartialType(
  CreateDocumentationTypeDto,
) {}
