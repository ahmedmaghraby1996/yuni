import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

export enum PromotionType {
  OFFER = 'offer',
  BRANCH = 'branch',
}

@Entity()
export class Promotion extends AuditableEntity {
  @Column()
  user_id: string;

  @Column()
  target_id: string;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
