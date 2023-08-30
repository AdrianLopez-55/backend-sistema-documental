import { ApiProperty } from '@nestjs/swagger';

export class LoginCentralAuthDTO {
  @ApiProperty()
  app: string;

  @ApiProperty()
  token: string;
}
