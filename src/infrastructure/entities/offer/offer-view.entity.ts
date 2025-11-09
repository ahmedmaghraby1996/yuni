import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Offer } from './offer.entity';
import { User } from '../user/user.entity';

@Entity()
export class OfferView extends AuditableEntity {
  @ManyToOne(() => Offer)
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;

  @Column({ nullable: true })
  offer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_id: string;
}
