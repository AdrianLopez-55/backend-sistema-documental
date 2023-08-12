import { PartialType } from "@nestjs/swagger";
import { CreateDocumentDestinationDto } from "./createDocumentDestination.dto";

export class UpdateDocumentDestinationDto extends PartialType(CreateDocumentDestinationDto){}