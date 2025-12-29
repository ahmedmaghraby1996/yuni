import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Offer } from './offer.entity';

@Entity()
export class OfferUsage extends AuditableEntity {
  @Column()
  user_id: string;

  @Column()
  offer_id: string;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Offer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;
}
