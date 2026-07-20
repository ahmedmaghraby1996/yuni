import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Package } from '../package/package.entity';

@Entity()
export class Subscription extends AuditableEntity {
  @Column()
  name_ar: string;
  @Column()
  name_en: string;
  @ManyToOne(() => User, (user) => user.subscriptions)
  user: string;
  @Column({ nullable: true })
  user_id: string;
  @Column()
  description_ar: string;
  @Column()
  description_en: string;
  @Column()
  expire_at: Date;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;
  @Column({ default: true })
  is_active: boolean;
  @Column({ nullable: true })
  package_id: string;

  @ManyToOne(() => Package, { nullable: true, eager: false })
  @JoinColumn({ name: 'package_id' })
  package: Package;
}
