import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Package extends AuditableEntity {
  @Column()
  name_ar: string;

  @Column()
  name_en: string;

  @Column()
  description_ar: string;

  @Column()
  description_en: string;

  @Column()
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  order_by: number;

  @Column({ default: false })
  is_current: boolean;

  /** null = unlimited */
  @Column({ nullable: true, type: 'int' })
  offers_count: number | null;

  /** null = unlimited */
  @Column({ nullable: true, type: 'int' })
  codes_count: number | null;

  /** null = unlimited */
  @Column({ nullable: true, type: 'int' })
  branches_count: number | null;

  @Column({ type: 'simple-json', nullable: true })
  features_ar: string[];

  @Column({ type: 'simple-json', nullable: true })
  features_en: string[];

  @Column({ nullable: true })
  color: string;
}
