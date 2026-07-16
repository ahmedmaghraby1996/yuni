import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseTransaction } from 'src/core/base/database/base.transaction';
import { DataSource, EntityManager, In } from 'typeorm';
import { UpdateOfferRequest } from '../dto/requests/update-offer.request';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as fs from 'fs';
import { OfferImages } from 'src/infrastructure/entities/offer/offer-images.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';

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

      const user = this.request.user;
      const roles: string[] = user?.roles || [];
      const isAdmin = roles.includes(Role.ADMIN) || roles.includes(Role.SUPERADMIN);
      const owner_user_id = (user as any).owner_user_id ?? user?.id;

      if (!isAdmin && existingOffer.user_id !== owner_user_id) {
        throw new ForbiddenException(
          `You do not have permission to update this offer.`,
        );
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

      const originalPrice = req.original_price ?? existingOffer.original_price;
      const offerPrice = req.offer_price ?? existingOffer.offer_price;
      const offer_percentage =
        originalPrice && offerPrice
          ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100 * 100) / 100
          : existingOffer.offer_percentage;

      // Update offer fields
      const updatedData = new Offer({
        offer_price: req.offer_price,
        original_price: req.original_price,
        offer_percentage,
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
      const newImages = req?.images?.map((image, index) => {
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
          order_by: index,
          offer_id: existingOffer.id,
        });
      });

      if ((req as any).all_branches && !isAdmin) {
        existingOffer.stores = await context.find(Store, {
          where: { user_id: owner_user_id },
        });
      } else if (req?.stores?.length > 0) {
        const storeWhereClause: any = { id: In(req.stores) };
        if (!isAdmin) storeWhereClause.user_id = owner_user_id;
        const stores = await context.find(Store, { where: storeWhereClause });
        if (!isAdmin && stores.length !== req.stores.length) {
          throw new ForbiddenException(
            'You can only associate your own stores with this offer.',
          );
        }
        existingOffer.stores = stores;
      }
      await context.save(existingOffer);
      if (newImages?.length > 0) {
        await context.remove(existingOffer.images);
        await context.save(newImages);
      }

      return existingOffer;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
