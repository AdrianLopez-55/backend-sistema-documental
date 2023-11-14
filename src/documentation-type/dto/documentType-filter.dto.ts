import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class DocumentationTypeFilter {
  @ApiProperty({
    example: 'Licencia',
    description: 'search documetation type by name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  typeName: string;

  @ApiProperty({
    example: '654be1fe3655ba0ecdb22e4f',
    description: 'search document type by id tmeplate',
    required: false,
  })
  @IsOptional()
  @IsString()
  idTemplateDocType: string;

  @ApiProperty({
    example: true,
    description: 'search documentation type by active or not',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  activeDocumentType: boolean;

  @IsOptional()
  @IsPositive()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  page?: number;
}
