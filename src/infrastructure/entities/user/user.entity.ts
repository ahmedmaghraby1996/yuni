import { Expose } from 'class-transformer';
import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import {
  Entity,
  Column,
  BeforeInsert,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Factory } from 'nestjs-seeder';
import { randNum } from 'src/core/helpers/cast.helper';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Language } from 'src/infrastructure/data/enums/language.enum';
import { Address } from './address.entity';

import { NotificationEntity } from '../notification/notification.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Transaction } from '../wallet/transaction.entity';

import { SuggestionsComplaints } from '../suggestions-complaints/suggestions-complaints.entity';
import { City } from '../city/city.entity';
import { Chat } from '../chat/chat.entity';
import { Store } from '../store/store.entity';
import { Subscription } from '../subscription/subscription.entity';

@Entity()
export class User extends AuditableEntity {
  @Factory((faker) => faker.phone.number('########'))
  @Column({ length: 8, unique: true })
  @Expose()
  account: string;

  @OneToMany(() => Store, (store) => store.user)
  @Expose()
  stores: Store[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  @Expose()
  subscriptions: Subscription[];

  @ManyToOne(() => City)
  @Expose()
  city: City;

  @Column({ nullable: true })
  @Expose()
  city_id: string;

  @OneToMany(() => Chat, (chat) => chat.client)
  @Expose()
  client_chats: Chat[];

  @OneToMany(() => Chat, (chat) => chat.store)
  @Expose()
  store_chats: Chat[];

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  @Expose()
  notifications: NotificationEntity[];

  @Factory((faker) => faker.helpers.unique(faker.internet.domainName))
  @Column({ length: 100, unique: true })
  @Expose()
  username: string;

  @Column({ length: 100 })
  @Expose()
  name: string;

  @OneToMany(() => SuggestionsComplaints, (s) => s.user)
  @Expose()
  suggestionsComplaints: SuggestionsComplaints[];

  @Column({ nullable: true, length: 60 })
  @Expose()
  password: string;

  @Factory((faker, ctx) => faker.internet.email(ctx.name))
  @Column({ nullable: true, length: 100 })
  @Expose()
  email: string;

  @Factory((faker) => faker.date.future())
  @Column({ nullable: true })
  @Expose()
  email_verified_at: Date;

  @Factory((faker) => faker.phone.number('+965#########'))
  @Column({ nullable: true, length: 20 })
  @Expose()
  phone: string;

  @Factory((faker) => faker.date.future())
  @Column({ nullable: true })
  @Expose()
  phone_verified_at: Date;

  @Factory((faker) => faker.internet.avatar())
  @Column({ nullable: true, length: 500 })
  @Expose()
  avatar: string;

  @Factory((faker) => faker.helpers.arrayElement(Object.values(Gender)))
  @Column({ nullable: true, type: 'enum', enum: Gender })
  @Expose()
  gender: Gender;

  @Column({ nullable: true, length: 500 })
  @Expose()
  fcm_token: string;

  @Column({ nullable: true })
  @Expose()
  birth_date: string;

  @Column({ type: 'enum', enum: Language, default: Language.EN })
  @Expose()
  language: Language;

  @Column({ default: true })
  @Expose()
  is_active: boolean;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  @Expose()
  wallet: Wallet;

  @ManyToOne(() => Transaction, (transaction) => transaction.user)
  @Expose()
  transactions: Transaction[];

  @Column({ type: 'set', enum: Role, default: [Role.CLIENT] })
  @Expose()
  roles: Role[];

  @OneToMany(() => Address, (address) => address.user, {
    cascade: true,
  })
  @Expose()
  addresses: Promise<Address[]>;



  @Column({ nullable: true })
  id_number: string;

  @Column({ nullable: true })
  bank_account_number: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_branch: string;

  @Column({ nullable: true })
  certificate: string;
  @Column({ nullable: true })
  resume: string;

  @Column({ nullable: true ,unique: true})
  code: string;

  @OneToMany(() => User, (user) => user.agent)
  merchants: User[];

  @ManyToOne(() => User, (user) => user.merchants)
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ nullable: true })
  agent_id: string;



  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }

  public uniqueIdGenerator(): string {
    return randNum(8);
  }

  @BeforeInsert()
  generateAccount() {
    if (!this.account) this.account = this.uniqueIdGenerator();
  }
}
