import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fcm_token: string;


}
