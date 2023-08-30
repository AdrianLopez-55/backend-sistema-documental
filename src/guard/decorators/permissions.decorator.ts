import { SetMetadata } from '@nestjs/common';
import { Permission } from '../constants/Permission';

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);
