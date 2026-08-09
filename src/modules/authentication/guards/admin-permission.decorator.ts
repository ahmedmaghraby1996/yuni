import { SetMetadata } from '@nestjs/common';
import { AdminEmployeePermissions } from 'src/infrastructure/entities/admin/admin-employee.entity';

export type AdminPermissionModule = keyof AdminEmployeePermissions;
export type AdminPermissionAction = 'view' | 'add' | 'edit' | 'delete';

export const ADMIN_PERMISSION_KEY = 'admin_employee_permission';

export const AdminPermission = (module: AdminPermissionModule, action: AdminPermissionAction) =>
  SetMetadata(ADMIN_PERMISSION_KEY, { module, action });
