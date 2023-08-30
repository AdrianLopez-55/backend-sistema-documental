import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty()
  rolName: string;
}
