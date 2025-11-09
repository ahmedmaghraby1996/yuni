import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { FavoriteOffer } from 'src/infrastructure/entities/offer/favorite-offer.entity';
import { BranchResponse } from 'src/modules/user/dto/branch.response';

export class OfferResponse {
  @Expose()
  id: string;
  @Expose()
  title_ar: string;
  @Expose()
  title_en: string;
  @Expose()
  description_ar: string;
  @Expose()
  description_en: string;

 
  @Expose()
  start_date: Date;
  @Expose()
  is_favorite: boolean;
  @Expose()
  end_date: Date;
  @Expose()
  original_price: number;
  @Expose()
  offer_price: number;
  @Expose()
  code: string;

  @Expose()
  @Transform((value) => {
    return value.obj.images?.map((image) => {
      image.image = toUrl(image.image);
      return image;
    });
  })
  images: any;
  @Expose()
  @Type(() => BranchResponse)
  stores: BranchResponse;
  @Expose()
  is_active: boolean;
  @Expose()
  views: number;
  @Expose()
  @Type(() => SubCategory)
  subcategory: SubCategory;
  @Expose()
  @Transform((value) => {
    return plainToInstance(Category, value.obj?.subcategory?.category);
  })
  category: Category;

  @Expose()
  is_special: boolean;
}
