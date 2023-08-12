import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ObtainDataDocumentationTypeDto {
  @ApiProperty()
  @IsString()
  _idDocumentationType: string;

  @ApiProperty()
  @IsString()
  typeName: string;
}
