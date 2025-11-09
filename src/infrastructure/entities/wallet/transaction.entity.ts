import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';
import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';

import { randNum } from 'src/core/helpers/cast.helper';

@Entity()
export class Transaction extends AuditableEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;



  @Column({ default: TransactionTypes.OTHER })
  type: TransactionTypes;


  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 8, unique: true })
  number: string;

  @Column()
  user_id: string;

  @Column({nullable:true})
  meta_data: string

  constructor(partial?: Partial<Transaction>) {
    super();
    Object.assign(this, partial);
  }
  
  public uniqueIdGenerator(): string {
    return randNum(8);  
  }
  @BeforeInsert()
  generateAccount() {
    // ensure the account is unique
    if (!this.number) this.number = this.uniqueIdGenerator();
  }
}
