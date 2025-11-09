import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { City } from '../city/city.entity';
import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { User } from '../user/user.entity';
import { Offer } from '../offer/offer.entity';
import { Category } from '../category/category.entity';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
@Entity()
export class Store extends OwnedEntity {
  @Column({ nullable: true })
  name: string;

  @Column({ type: 'enum', enum: StoreStatus, default: StoreStatus.PENDING })
  status: StoreStatus;

  @ManyToOne(() => User, (user) => user.stores, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  catalogue: string;

  @Column({ nullable: true })
  first_phone: string;

  @Column({ nullable: true })
  second_phone: string;

  @Column({ nullable: true })
  facebook_link: string;

  @Column({ nullable: true })
  instagram_link: string;

  @Column({ nullable: true })
  x_link: string;

  @Column({ nullable: true })
  whatsapp_link: string;

  @Column({ nullable: true })
  snapchat_link: string;

  @Column({ nullable: true })
  youtube_link: string;
  @Column({ nullable: true })
  tiktok_link: string;

  @Column({ nullable: true })
  cover_image: string;

  @Column({ default: 0 })
  is_active: boolean;

  @Column({ nullable: true })
  address: string;

  @ManyToOne(() => City, (city) => city.stores, { nullable: true })
  city: City;

  @Column({ nullable: true })
  city_id: string;
  // latitude
  @Column({ type: 'float', precision: 10, scale: 6, nullable: true })
  latitude: number;

  // longitude
  @Column({ type: 'float', precision: 11, scale: 6, nullable: true })
  longitude: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column({ default: false })
  is_main_branch: boolean;
  @OneToMany(() => Store, (store) => store.city, { nullable: true })
  branches: Store[];
  @ManyToOne(() => Store, (store) => store.branches, { nullable: true })
  @JoinColumn({ name: 'main_branch_id' })
  main_branch: Store;
  @Column({ nullable: true })
  main_branch_id: string;

  @ManyToMany(() => Offer, (offer) => offer.stores)
  offers: Offer[];

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;
  @Column({ nullable: true })
  category_id: string;

  @BeforeInsert()
  saveLocation() {
    if (this.latitude != null && this.longitude != null) {
      this.location = `POINT(${this.latitude} ${this.longitude})`;
    }
  }

  @BeforeUpdate()
  updateLocation() {
    if (this.latitude != null && this.longitude != null) {
      this.location = `POINT(${this.latitude} ${this.longitude})`;
    }
  }

  constructor(partial: Partial<Store>) {
    super();
    Object.assign(this, partial);
  }
}
