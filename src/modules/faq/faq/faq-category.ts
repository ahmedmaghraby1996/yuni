import { BaseEntity } from "src/infrastructure/base/base.entity";
import { Column, Entity, JoinColumn, OneToMany } from "typeorm";
import { FaqQuestion } from "./faq_question";
import { Factory } from "nestjs-seeder";

@Entity()
export class FaqCategory extends BaseEntity{
 @Factory((faker) => faker.helpers.unique(faker.lorem.word))
@Column()
name_ar:string
@Factory((faker) => faker.helpers.unique(faker.lorem.word))
@Column()
name_en:string
@OneToMany(()=>FaqQuestion,faq_question=>faq_question.category)
@JoinColumn({name:"category_id"})
questions:FaqQuestion[] 

constructor(partial: Partial<FaqCategory>) {
    super();
    Object.assign(this, partial);
  }

}