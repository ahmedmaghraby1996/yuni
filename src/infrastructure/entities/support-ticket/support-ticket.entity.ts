import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { TicketStatus } from 'src/infrastructure/data/enums/ticket-status.enum';

@Entity()
export class SupportTicket extends AuditableEntity {
  @Column()
  number: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.PENDING })
  status: TicketStatus;

  @Column({ type: 'text', nullable: true })
  reply: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
