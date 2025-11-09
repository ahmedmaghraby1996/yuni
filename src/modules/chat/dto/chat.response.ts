import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { UserResponse } from 'src/modules/user/dto/response/user-response';
import { MessageRespone } from './message.response';

export class ChatResponse {
  @Expose() id: string;
  @Expose() @Type(() => UserResponse) client: UserResponse;
  @Expose()
  @Transform((value) => {
    return value.obj?.store
      ? plainToInstance(
          UserResponse,
          { ...value.obj.store, avatar: value.obj?.store?.stores[0]?.logo },
          {
            excludeExtraneousValues: true,
          },
        )
      : null;
  })
    store: any;
  @Expose()
  @Type(() => MessageRespone)
  last_message: MessageRespone;
}
