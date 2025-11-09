import { BaseEntity } from 'src/infrastructure/base/base.entity';

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';

@Entity()
export class SuggestionsComplaints extends AuditableEntity {


  @Column()  
  title:string;

  @Column()  
  description:string;

  @ManyToOne(()=>User,(user)=>user.suggestionsComplaints)
  @JoinColumn({name:'user_id'})
  user:User
  @Column({nullable:true})
  user_id:string

  @Column({nullable:true})
  email:string
    
}
