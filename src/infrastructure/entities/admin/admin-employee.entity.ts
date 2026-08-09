import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { AdminEmployeeRole } from './admin-employee-role.entity';

export type AdminPermissionAction = 'view' | 'add' | 'edit' | 'delete';

export interface AdminModulePermission {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
}

export interface AdminEmployeePermissions {
  users?: AdminModulePermission;
  stores?: AdminModulePermission;
  employees?: AdminModulePermission;
  transactions?: AdminModulePermission;
  notifications?: AdminModulePermission;
  banners?: AdminModulePermission;
  static_pages?: AdminModulePermission;
  home?: AdminModulePermission;
}

@Entity()
export class AdminEmployee extends AuditableEntity {
  @Column()
  user_id: string;

  @Column({ type: 'json', nullable: true })
  permissions: AdminEmployeePermissions;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  role_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => AdminEmployeeRole, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: AdminEmployeeRole;
}
