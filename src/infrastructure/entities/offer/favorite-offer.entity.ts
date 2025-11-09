import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Offer } from './offer.entity';
import { User } from '../user/user.entity';

@Entity()
export class FavoriteOffer extends OwnedEntity {
  @ManyToOne(() => Offer, (offer) => offer.favorites)
  offer: Offer;

  @Column({ nullable: true })
  offer_id: string;

  @ManyToOne(() => User)
  user: User;
}
