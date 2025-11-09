import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { StaticPagesEnum } from 'src/infrastructure/data/enums/static-pages.enum';
import { Entity, Column } from 'typeorm';

@Entity()
export class StaticPage extends AuditableEntity {
    @Column({
        type: 'enum',
        nullable: false,
        enum: StaticPagesEnum
    })
    static_page_type: StaticPagesEnum;

    @Column({ type: "longtext", nullable: true })
    content_ar: string;

    @Column({ type: "longtext", nullable: true })
    content_en: string;
}
