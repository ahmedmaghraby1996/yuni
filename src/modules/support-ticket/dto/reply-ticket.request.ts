import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyTicketRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reply: string;
}
