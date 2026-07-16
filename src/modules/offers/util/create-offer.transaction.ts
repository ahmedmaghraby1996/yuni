import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseTransaction } from 'src/core/base/database/base.transaction';
import { DataSource, EntityManager, In } from 'typeorm';
import { CreateOfferRequest } from '../dto/requests/create-offer.request';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { plainToInstance } from 'class-transformer';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as fs from 'fs';
import { OfferImages } from 'src/infrastructure/entities/offer/offer-images.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';

@Injectable()
export class CreateOfferTransaction extends BaseTransaction<
  CreateOfferRequest,
  Offer
> {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) readonly request: Request,
  ) {
    super(dataSource);
  }

  protected async execute(
    req: CreateOfferRequest,
    context: EntityManager,
  ): Promise<Offer> {
    try {
      const owner_user_id = (this.request.user as any).owner_user_id ?? this.request.user.id;

      const offer_percentage =
        req.original_price && req.offer_price
          ? Math.round(((req.original_price - req.offer_price) / req.original_price) * 100 * 100) / 100
          : null;

      const offer = context.create(
        Offer,
        plainToInstance(Offer, { ...req, user_id: owner_user_id, offer_percentage }),
      );

      let stores: Store[];
      if (req.all_branches) {
        stores = await context.find(Store, { where: { user_id: owner_user_id } });
      } else {
        stores = await context.find(Store, { where: { id: In(req.stores ?? []) } });
      }

      offer.stores = stores;
      await context.save(offer);

      if (req?.images?.length > 0) {
        const images = req.images.map((image, index) => {
          let imagePath = image;
          if (!/^https?:\/\//i.test(image) && image.includes('/tmp/')) {
            if (!fs.existsSync('storage/offer-images')) {
              fs.mkdirSync('storage/offer-images');
            }
            imagePath = image.replace('/tmp/', '/offer-images/');
            fs.renameSync(image, imagePath);
          }
          return new OfferImages({
            image: imagePath,
            order_by: index + 1,
            offer_id: offer.id,
          });
        });
        await context.save(images);
      }
      return offer;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
