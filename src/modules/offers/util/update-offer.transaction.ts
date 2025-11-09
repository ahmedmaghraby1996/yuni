import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseTransaction } from 'src/core/base/database/base.transaction';
import { DataSource, EntityManager, In } from 'typeorm';
import { UpdateOfferRequest } from '../dto/requests/update-offer.request';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { plainToInstance } from 'class-transformer';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as fs from 'fs';
import { OfferImages } from 'src/infrastructure/entities/offer/offer-images.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';

@Injectable()
export class UpdateOfferTransaction extends BaseTransaction<
  UpdateOfferRequest,
  Offer
> {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) readonly request: Request,
  ) {
    super(dataSource);
  }

  protected async execute(
    req: UpdateOfferRequest,
    context: EntityManager,
  ): Promise<Offer> {
    try {
      const existingOffer = await context.findOne(Offer, {
        where: { id: req.id },
        relations: ['images', 'stores'],
      });

      if (!existingOffer) {
        throw new NotFoundException(`Offer with ID ${req.id} not found.`);
      }
      if(req.subcategory_id){
      const subcategory = await context.findOne(SubCategory, {
        where: { id: req.subcategory_id },
      });
      if (!subcategory) {
        throw new NotFoundException(
          `SubCategory with ID ${req.subcategory_id} not found.`,
        );
      }}

      // Update offer fields
      const updatedData = new Offer({
        offer_price: req.offer_price,
        original_price: req.original_price,
        title_ar: req.title_ar,
        title_en: req.title_en,
        description_ar: req.description_ar,
        description_en: req.description_en,
        start_date: req.start_date,
        is_active: req.is_active,
        subcategory_id: req.subcategory_id,
        end_date: req.end_date,
        code: req.code,
        
      });
      Object.assign(existingOffer, updatedData);

      // Update offer images
      const newImages = req?.images?.map((image) => {
        if (!fs.existsSync('storage/offer-images')) {
          fs.mkdirSync('storage/offer-images');
        }
        const newPath = image.replace('/tmp/', '/offer-images/');
        fs.renameSync(image, newPath);
        return new OfferImages({
          image: newPath,
          order_by: req.images.indexOf(image),
          offer_id: existingOffer.id,
        });
      });

      // Remove old images (optional)
   
if(req?.stores?.length > 0) {
      // Update associated stores
      const stores = await context.find(Store, {
        where: {
          id: In(req.stores),
        },
      });

      existingOffer.stores = stores;
    }
      await context.save(existingOffer);
      if (newImages?.length > 0) {
         await context.remove(existingOffer.images);
      await context.save(newImages);}

      return existingOffer;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
