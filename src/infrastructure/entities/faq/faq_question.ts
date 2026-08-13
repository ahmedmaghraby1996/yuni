import { BaseEntity } from "src/infrastructure/base/base.entity";
import { Column, Entity } from "typeorm";

import { Factory } from "nestjs-seeder";

@Entity()
export class FaqQuestion extends BaseEntity{
 @Factory((faker) => faker.helpers.unique(faker.lorem.word))
@Column()
title_ar:string
@Factory((faker) => faker.helpers.unique(faker.lorem.word))
@Column()
title_en:string
@Factory((faker) => faker.helpers.unique(faker.lorem.word))
@Column()
descrption_ar:string
@Factory((faker) => faker.helpers.unique(faker.lorem.word))
@Column()
descrption_en:string

@Column({ default: true })
is_active: boolean;

constructor(partial: Partial<FaqQuestion>) {
    super();
    Object.assign(this, partial);
  }
}