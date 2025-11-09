import { Expose, Transform, Type } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { UserResponse } from './response/user-response';

export class BranchResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;
  @Expose()
  is_main_branch: boolean;

  @Expose()
  latitude: number;

  @Expose()
  longitude: number;

  @Expose()
  address: string;
  @Expose()
  @Transform((value) => toUrl(value.obj.logo))
  logo: string;
  @Expose()
  @Transform((value) => toUrl(value.obj.catalogue))
  catalogue: string;
  @Expose()
  first_phone: string;
  @Expose()
  @Type(() => Category)
  category: Category;

  @Expose()
  second_phone: string;

  @Expose()
  facebook_link: string;

  @Expose()
  instagram_link: string;

  @Expose()
  x_link: string;

  @Expose()
  @Transform((value) => value.obj?.offers?.length)
  offers_count: number;

  @Expose()
  is_active: boolean;

  @Expose()
  status: StoreStatus;

  @Expose()
  whatsapp_link: string;

  @Expose()
  snapchat_link: string;

  @Expose()
  youtube_link: string;

  @Expose()
  twitter_link: string;


  @Expose()
  @Type(() => UserResponse)
  user: UserResponse
  
@Expose()
city_id: string;
@Expose()
  @Transform((value) =>value.obj?.city)
  city: City;
  
}
