import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity } from 'typeorm';
import { EmployeePermissions } from './store-employee.entity';

@Entity()
export class StoreEmployeeRole extends AuditableEntity {
  @Column()
  name_ar: string;

  @Column()
  name_en: string;

  @Column()
  owner_user_id: string;

  @Column({ type: 'json' })
  permissions: EmployeePermissions;
}
