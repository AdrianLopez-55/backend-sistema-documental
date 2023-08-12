import { PartialType } from "@nestjs/swagger";
import { StepDto } from "./step.dto";

export class UpdateStepDto extends PartialType(StepDto){}