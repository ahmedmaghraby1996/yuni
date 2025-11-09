import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Store } from '../store/store.entity';
import { OfferImages } from './offer-images.entity';
import { SubCategory } from '../category/subcategory.entity';
import { User } from '../user/user.entity';
import { FavoriteOffer } from './favorite-offer.entity';
@Entity()
export class Offer extends AuditableEntity {
  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  title_ar: string;

  @Column({ default: false })
  is_special: boolean;

  is_favorite: boolean;

  @OneToMany(() => FavoriteOffer, (favoriteOffer) => favoriteOffer.offer, {
    onDelete: 'CASCADE',
  })
  favorites: FavoriteOffer[];

  @Column()
  title_en: string;

  @Column()
  description_ar: string;

  @Column()
  description_en: string;

  @OneToMany(() => OfferImages, (offerImages) => offerImages.offer)
  images: OfferImages[];

  @Column({ nullable: true })
  start_date: Date;

  @Column({ nullable: true })
  duration_in_days: number;

  @Column({ nullable: true })
  end_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  original_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  offer_price: number;

  @Column({ nullable: true })
  code: string;

  @ManyToMany(() => Store, (store) => store.offers)
  @JoinTable()
  stores: Store[];

  @ManyToOne(() => SubCategory, (subcategory) => subcategory.offers)
  subcategory: SubCategory;
  @Column({ nullable: true })
  subcategory_id: string;

  @Column({ default: true })
  is_active: boolean;
  @Column({ default: 0 })
  views: number;

  constructor(partial: Partial<Offer>) {
    super();
    Object.assign(this, partial);
  }
}
