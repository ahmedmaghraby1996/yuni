import { SetMetadata } from '@nestjs/common';

export type PermissionModule =
  | 'dashboard'
  | 'branches'
  | 'offers'
  | 'packages'
  | 'customers'
  | 'employees'
  | 'reports'
  | 'support'
  | 'profile';

export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export const PERMISSION_KEY = 'employee_permission';

export const Permission = (module: PermissionModule, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { module, action });
