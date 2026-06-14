import { Expose, Type } from 'class-transformer';
import { TicketStatus } from 'src/infrastructure/data/enums/ticket-status.enum';
import { UserResponse } from 'src/modules/user/dto/response/user-response';

export class TicketResponse {
  @Expose()
  id: string;

  @Expose()
  number: number;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: TicketStatus;

  @Expose()
  reply: string;

  @Expose()
  @Type(() => UserResponse)
  user: UserResponse;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
