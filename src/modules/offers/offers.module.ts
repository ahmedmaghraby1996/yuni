import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { FavoriteOfferService, OffersService } from './offers.service';
import { CreateOfferTransaction } from './util/create-offer.transaction';

import { UpdateOfferTransaction } from './util/update-offer.transaction';
import { SubCategoryService } from './sub_category.service';
import { StoreService } from './store.service';
import { CategoryService } from '../category/category.service';
import { FileService } from '../file/file.service';

@Module({
  controllers: [OffersController],
  providers: [
    OffersService,
    CreateOfferTransaction,
    CategoryService,
    UpdateOfferTransaction,
    SubCategoryService,
    StoreService,
    FavoriteOfferService,
    FileService
  ],
})
export class OffersModule {}
