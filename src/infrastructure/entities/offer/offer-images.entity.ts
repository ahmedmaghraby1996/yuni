import { AuditableEntity } from "src/infrastructure/base/auditable.entity"
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm"
import { Offer } from "./offer.entity"
@Entity()
export class OfferImages extends AuditableEntity{
    @Column({nullable:true})
    offer_id: string

    @Column()
    image: string

    @Column()
    order_by: number

    @ManyToOne(() => Offer, (offer) => offer.images)
    @JoinColumn({ name: 'offer_id' })
    offer: Offer

   constructor(partial: Partial<OfferImages>) {
    super();
    Object.assign(this, partial);
  }
}