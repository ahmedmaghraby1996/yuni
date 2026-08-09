import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity } from 'typeorm';
import { AdminEmployeePermissions } from './admin-employee.entity';

@Entity()
export class AdminEmployeeRole extends AuditableEntity {
  @Column()
  name_ar: string;

  @Column()
  name_en: string;

  @Column({ type: 'json', nullable: true })
  permissions: AdminEmployeePermissions;
}
