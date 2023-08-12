import { PartialType } from "@nestjs/swagger";
import { PasoDto } from "./paso.dto";

export class UpdatePasoDto extends PartialType(PasoDto){}