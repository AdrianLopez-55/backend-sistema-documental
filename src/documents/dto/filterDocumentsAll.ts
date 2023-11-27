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

export class FilterDocumentsAll {
  @ApiProperty({
    example: 'DOC-0000020-2023',
    description: 'search document by number document',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  numberDocument: string;

  // @ApiProperty({
  //   example: '64e84144561052a834987264',
  //   description: 'search document by id user',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // @MinLength(8)
  // userId: string;

  @ApiProperty({
    example: 'Gastos',
    description: 'search document by title',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example: 'Costos',
    description: 'search document by documentation type',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  typeName: string;

  @ApiProperty({
    example: 'INICIADO',
    description: 'search document by state document user send',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  stateDocumentUserSend: string;

  @ApiProperty({
    example: 'workflow_A',
    description: 'search document by workflow name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  nombre: string;

  @ApiProperty({
    example: 'this is description',
    description: 'search document by description workflow',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  descriptionWorkflow: string;

  // @ApiProperty({
  //   example: 'STEP B',
  //   description: 'search document by step name',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // @MinLength(8)
  // step: string;

  // @ApiProperty({
  //   example: 'this step is ...',
  //   description: 'search document by description step',
  //   required: false,
  // })
  // descriptionStep: string;

  // @ApiProperty({
  //   example: 1,
  //   description: 'search number paso in step pasos',
  //   required: false,
  // })
  // @IsOptional()
  // @IsNumber()
  // @MinLength(8)
  // paso: number;

  // @ApiProperty({
  //   example: 'RECTORADO',
  //   description: 'search name office in step',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // @MinLength(3)
  // oficina: string;

  // @ApiProperty({
  //   example: true,
  //   description: 'search if a paso was completed',
  //   required: false,
  // })
  // @IsOptional()
  // @IsBoolean()
  // @MinLength(8)
  // completado: boolean;

  // @ApiProperty({
  //   example: 2,
  //   description: 'search paso actual worflow',
  //   required: false,
  // })
  // @IsOptional()
  // @IsNumber()
  // @MinLength(8)
  // pasoActual: number;

  @ApiProperty({
    example: 'VICERECTORADO',
    description: 'search paso actual worflow',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  oficinaActual: string;

  @ApiProperty({
    example: 'is a description',
    description: 'search document from description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  description: string;

  @ApiProperty({
    example: true,
    description: 'search document is active or not',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  active: string;

  @ApiProperty({
    example: true,
    description: 'search by document by digital signature',
    required: false,
  })
  @IsOptional()
  @IsString()
  userDigitalSignature: string;

  @ApiProperty({
    example: '2023',
    description: 'search document for year',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  year: string;

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
