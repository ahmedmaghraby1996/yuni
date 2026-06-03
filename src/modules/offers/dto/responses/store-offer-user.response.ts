import { Expose, Transform } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';

export class StoreOfferUserResponse {
  @Expose({ name: 'userId' })
  id: string;

  @Expose()
  name: string;

  @Expose()
  phone: string;

  @Expose()
  @Transform(({ obj }) => toUrl(obj.avatar))
  avatar: string;

  @Expose({ name: 'activated_count' })
  codes_count: number;
}
