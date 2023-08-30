import { ApiProperty } from '@nestjs/swagger';

export class SetPermissionToRolDto {
  @ApiProperty()
  permissionName: string;
}
