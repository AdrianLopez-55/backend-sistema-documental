import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';
import { IsString } from 'class-validator';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
	@ApiProperty()
	@IsString()
	name?: string;
}
