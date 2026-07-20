import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { StoreEmployeeRole } from './store-employee-role.entity';

export interface ModulePermission {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
}

export interface EmployeePermissions {
  dashboard?: Pick<ModulePermission, 'view'>;
  branches?: ModulePermission;
  offers?: ModulePermission;
  packages?: ModulePermission;
  customers?: Pick<ModulePermission, 'view'>;
  employees?: ModulePermission;
  reports?: Pick<ModulePermission, 'view'>;
  support?: ModulePermission;
  profile?: Pick<ModulePermission, 'view' | 'edit'>;
}

@Entity()
export class StoreEmployee extends AuditableEntity {
  @Column()
  user_id: string;

  @Column()
  owner_user_id: string;

  @Column({ type: 'json' })
  permissions: EmployeePermissions;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  role_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => StoreEmployeeRole, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: StoreEmployeeRole;
}
