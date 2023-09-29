import { ApiProperty } from '@nestjs/swagger';

export class CredentialUserDto {
  @ApiProperty()
  password: string;

  @ApiProperty()
  pin: string;
}
