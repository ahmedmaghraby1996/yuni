import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Country } from '../country/country.entity';
import { Store } from '../store/store.entity';
import { Expose } from 'class-transformer';


@Entity()
export class City extends AuditableEntity {
  @Column()
  @Expose()
  name_ar: string;

  @Column()
  @Expose()
  name_en: string;

  @ManyToOne(() => Country, (country) => country.cities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @Column({ nullable: true })
  country_id: string;
  @Column({ nullable: true })
  order_by: number;

  @OneToMany(()=>Store, (store) => store.city, { nullable: true })
  stores: Store[];
 
  constructor(partial?: Partial<City>) {
    super();
    Object.assign(this, partial);
  }
}
