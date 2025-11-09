// chat.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Column,
  JoinColumn,
} from 'typeorm';


import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { User } from '../user/user.entity';
import { Message } from './messages.entity';

@Entity()
export class Chat extends AuditableEntity {
  

  @ManyToOne(() => User, (user) => user.client_chats)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ nullable: true })
  client_id: string;

  @ManyToOne(() => User, (user) => user.store_chats)
  @JoinColumn({ name: 'store_id' })
  store: User;

  @Column({ nullable: true })
  store_id: string;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  constructor(partial: Partial<Chat>) {
    super();
    Object.assign(this, partial);
  }
}

