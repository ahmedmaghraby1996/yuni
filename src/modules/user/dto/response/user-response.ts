import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import e from 'express';

import { toUrl } from 'src/core/helpers/file.helper';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';

export class UserResponse {
  @Expose()
  id: string;
  @Expose()
  name: string;

  @Expose()
  phone: string;

  @Expose()
  is_active: boolean;
  @Expose()
  gender: string;
  @Expose()
  email: string;
  @Expose()
  @Transform(({ value }) => toUrl(value))
  avatar: string;
  @Expose()
  role: string;
  @Expose()
  created_at: Date;

  @Expose()
  @Transform((value) => {
    return value.obj?.city
      ? {
          id: value.obj.city.id,
          name_ar: value.obj.city?.name_ar,
          name_en: value.obj.city?.name_en,
        }
      : null;
  })
  city: City;

  @Expose()
  @Transform((value) => {
    if (value.obj?.subscriptions?.length > 0) return value.obj.subscriptions[0];
    else return null;
  })
  subscription: Subscription;
}

export class AgentResponse extends UserResponse {
  @Expose()
  resume: string;

  @Expose()
  @Type(() => City)
  city:City

  @Expose()
  cv: string;

  @Expose()
  certificate: string;

  @Expose()
  bank_account_number: string;

  @Expose()
  bank_name: string;

  @Expose()
  bank_branch: string;

  @Expose()
  id_number: string;

  @Expose()
  code: string;

  @Expose()
  nickname: string;

  @Expose()
  @Transform(( value ) => {
    return value.obj?.wallet ? value.obj?.wallet?.balance : 0;})
  wallet_balance: number;

  @Expose()
  @Type(() => UserResponse)
  merchants: UserResponse[];


}


export class AcceptAgentRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}
