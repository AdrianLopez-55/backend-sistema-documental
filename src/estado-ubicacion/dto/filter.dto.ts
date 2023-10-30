import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class EstadoUbicacionFilter {
  @ApiProperty({
    example: 'faeonfdjfx ',
    description: 'search by ID document',
    required: false,
  })
  @IsOptional()
  @IsString()
  idDocument: string;

  @ApiProperty({
    example: 'RECTORADO',
    description: 'search by name office',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  office: string;

  @ApiProperty({
    example: 'EN ESPERA',
    description: 'search document by state of the office',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  stateOffice: string;

  @ApiProperty({
    example: 2,
    description: 'search by number of the paso of the woekflow',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @MinLength(3)
  numberPasoOffice: number;

  @ApiProperty({
    example: '8721455',
    description: 'seach a document by ci user recieved',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  ciUser: string;

  @ApiProperty({
    example: 'iodfanfajkd',
    description: 'seach by ID of the user recieved',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  idOfUser: string;

  @ApiProperty({
    example: 'RETORADO',
    description: 'search by name office of the users recieved',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  nameOfficeUserRecieved: string;

  @ApiProperty({
    example: '',
    description: 'seach by date recieved user the document',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @MinLength(3)
  dateRecived: Date;

  @ApiProperty({
    example: 'RECIBIDO',
    description: 'search by state user from the document',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  stateDocumentUser: string;

  @ApiProperty({
    example: true,
    description: 'search if user has be observed',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  observado: boolean;

  @ApiProperty({
    example: true,
    description: 'search office can be active',
    required: false,
  })
  @IsOptional()
  @IsString()
  activo: boolean;
}
