//social link entity

import { Entity, Column, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { Transaction } from './transaction.entity';

import { User } from '../user/user.entity';
import { OwnedEntity } from 'src/infrastructure/base/owned.entity';

@Entity()
export class Wallet extends OwnedEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2,nullable: true })
  limit: number;
  //one to many relation with user
  @OneToOne(() => User, (user) => user.wallet,{onDelete: 'CASCADE'})
  @JoinColumn({ name: 'user_id' })
  user: User;

  



  constructor(partial?: Partial<Wallet>) {
    super();
    Object.assign(this, partial);
  }
}
