import { Expose, Transform, Type } from 'class-transformer';
import { UserResponse } from 'src/modules/user/dto/response/user-response';

export class WalletResponse {
  @Expose() id: string;
  @Expose() balance: number;
  @Expose() limit: number;
  @Expose() user_id: string;
  @Expose() created_at: Date;

  @Expose()
  @Type(() => UserResponse)
  user: UserResponse;
}
