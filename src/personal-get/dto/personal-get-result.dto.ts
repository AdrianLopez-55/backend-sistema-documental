import { ApiProperty } from '@nestjs/swagger';

export class ObtainDataPersonalGetDto {
  @ApiProperty()
  _idPersonal?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  ci?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  unity?: string;

  @ApiProperty()
  file?: string;
}
