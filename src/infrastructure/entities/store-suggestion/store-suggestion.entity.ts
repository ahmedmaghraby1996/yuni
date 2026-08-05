import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class StoreSuggestion extends AuditableEntity {
  @Column()
  user_id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
