import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { SubCategory } from './subcategory.entity';
import { Expose, Transform } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
@Entity()
export class Category extends AuditableEntity {
  @Column()
  @Expose()
  name_ar: string;
  @Column()
  @Expose()
  name_en: string;
  @Column({ nullable: true })
  @Transform(({ value }) => toUrl(value))
  @Expose()
  logo: string;
  @Column({ nullable: true })
   @Expose()
  order_by: number;

  @Column({ default: true })
   @Expose()
  is_active: boolean;

  @OneToMany(() => SubCategory, (subcategory) => subcategory.category)
  subcategories: SubCategory[];
}
//
