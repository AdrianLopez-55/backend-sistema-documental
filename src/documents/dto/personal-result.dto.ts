import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ObtainDataPersonalDTO {
  @ApiProperty({ example: 'Resources from DataCenter' })
  @IsString()
  readonly title: string;

  @ApiProperty({ example: 'Contract' })
  @IsString()
  readonly documentType: string;

  @ApiProperty({ example: 'Revision' })
  @IsString()
  readonly stateDocument: string;

  @ApiProperty({ example: 'restricted' })
  @IsString()
  readonly nivelAcces: string;

  @ApiProperty({
    example: 'contract document registration for new staff. It is on revision',
  })
  @IsString()
  readonly description: string;

  @ApiProperty({ example: 'data:@file/jpeg;base64,/9jqw4AAQ...' })
  file: string;

  //---------------personal DTO ----------------------------------------
  @ApiProperty()
  @IsString()
  _idPersonal?: string;

  @ApiProperty()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsString()
  ci?: string;

  @ApiProperty()
  @IsString()
  email?: string;

  @ApiProperty()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsString()
  nationality?: string;
}
