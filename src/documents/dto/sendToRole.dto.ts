import { ApiProperty } from '@nestjs/swagger';

export class SendToRoleDto {
  @ApiProperty()
  documentId: string;

  @ApiProperty()
  roleName: string;
}
