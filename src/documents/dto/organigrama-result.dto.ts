import { ApiProperty } from '@nestjs/swagger';

export class ObtainOrganigramaDto {
  @ApiProperty()
  _idOrganigrama: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  children: string[];
}
