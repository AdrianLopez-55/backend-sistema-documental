import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CreateRoadmapDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  updateDate: string;

  @ApiProperty()
  objetives: string[];

  @ApiProperty()
  @Type(() => FuntionalityDto)
  funtionalities: FuntionalityDto[];

  @ApiProperty()
  @Type(() => RiskDto)
  risks: RiskDto[];

  @ApiProperty()
  currentStatus: string;

  @ApiProperty()
  additionalNotes: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => AssignedDocumentDto)
  assignedDocuments: AssignedDocumentDto[];
}

export class FuntionalityDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  state: string;
}

export class RiskDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  mitigation: string;
}

export class AssignedDocumentDto {
  @ApiProperty()
  numberDocument: string;

  @ApiProperty()
  nameDestinationUser: string;
}
