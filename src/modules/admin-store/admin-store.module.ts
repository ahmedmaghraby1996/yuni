import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Promotion } from 'src/infrastructure/entities/promotion/promotion.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { AdminStoreService } from './admin-store.service';
import { AdminStoreController } from './admin-store.controller';
import { AdminSubcategoryController } from './admin-subcategory.controller';
import { FileService } from '../file/file.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Promotion, Subscription, SubCategory, Offer])],
  controllers: [AdminStoreController, AdminSubcategoryController],
  providers: [AdminStoreService, FileService],
})
export class AdminStoreModule {}
