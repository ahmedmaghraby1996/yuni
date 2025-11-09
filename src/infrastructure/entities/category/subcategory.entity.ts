import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Category } from "./category.entity";
import { Offer } from "../offer/offer.entity";
import { Expose, Transform } from "class-transformer";
import { toUrl } from "src/core/helpers/file.helper";
@Entity()
export class SubCategory extends AuditableEntity {
  @Column()
  @Expose()
  name_ar: string;
  @Column()
  @Expose()
  name_en: string;
  @Column({ nullable: true })
   @Transform(({ value }) => {
    toUrl(value);
  })
  logo: string;

 @ManyToOne(() => Category, (category) => category.subcategories)
 @JoinColumn()
 @Expose()
 category: Category

 @Column({ nullable: true })
 category_id: number;

 @Column({ nullable: true })
  @Expose()
 order_by: number;

 @Column({ default: true })
  @Expose()
 is_active: boolean

 @OneToMany(() => Offer, (offer) => offer.subcategory)
 offers: Offer[]

 constructor(partial: Partial<SubCategory>) {
  super();
  Object.assign(this, partial);
 }
}