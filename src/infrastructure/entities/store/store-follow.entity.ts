import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Store } from './store.entity';
import { User } from '../user/user.entity';

@Entity()
export class StoreFollow extends OwnedEntity {
  @ManyToOne(() => Store, (store) => store.followers)
  store: Store;

  @Column({ nullable: true })
  store_id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  user_id: string;
}
