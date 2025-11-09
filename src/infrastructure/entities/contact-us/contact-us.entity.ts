import { Factory } from 'nestjs-seeder';
import { BaseEntity } from 'src/infrastructure/base/base.entity';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
export class ContactUs extends BaseEntity {
  @Factory((faker) => faker.helpers.unique(faker.internet.userName))
  @Column({ length: 100, unique: true })
  title_en: string;

  @Factory((faker) => faker.helpers.unique(faker.internet.userName))
  @Column({ length: 100, unique: true })
  title_ar: string;

  @Factory((faker) => faker.internet.avatar())
  @Column({ length: 500 })
  logo: string;

  @Factory((faker) => faker.internet.url())
  @Column({ length: 500 })
  url: string;
}
