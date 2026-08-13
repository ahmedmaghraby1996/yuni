import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import e from 'express';

import { extractPhoneDetails } from 'src/core/helpers/phone.helper';
import { toUrl } from 'src/core/helpers/file.helper';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';

export class UserResponse {
  @Expose()
  id: string;
  @Expose()
  name: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.phone) return null;
    const details = extractPhoneDetails(obj.phone);
    return details?.code || null; // Return null if code is empty string or not found
  })
  code: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.phone) return null;
    const details = extractPhoneDetails(obj.phone);
    return details?.phone || obj.phone;
  })
  phone: string;

  @Expose()
  status: string;
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
    const sub = value.obj?.subscriptions?.[0];
    if (!sub) return null;
    return {
      id: sub.id,
      name_ar: sub.name_ar,
      name_en: sub.name_en,
      description_ar: sub.description_ar,
      description_en: sub.description_en,
      price: sub.price,
      expire_at: sub.expire_at,
      is_active: sub.is_active,
      package_id: sub.package_id,
      created_at: sub.created_at,
      package: sub.package ?? null,
    };
  })
  subscription: Subscription;

  @Expose()
  birth_date: Date;

  @Expose()
  school_name: string;

  @Expose()
  major: string;

  @Expose()
  language: string;

  @Expose()
  @Transform(({ value }) => toUrl(value))
  resume: string;

  @Expose()
  @Transform(({ value }) => toUrl(value))
  certificate: string;

  @Expose()
  id_number: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.favorite_sections?.map((s: SubCategory) => ({
      id: s.id,
      name_ar: s.name_ar,
      name_en: s.name_en,
      category: s.category ? { id: s.category.id, name_ar: s.category.name_ar, name_en: s.category.name_en } : null,
    })) ?? [],
  )
  favorite_sections: SubCategory[];

  @Expose()
  profile_completion_percentage: number;

  @Expose()
  @Transform(({ obj }) => obj.store ?? null)
  store: any;
}

export class AgentResponse extends UserResponse {
  @Expose()
  resume: string;

  @Expose()
  @Type(() => City)
  city: City;

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
  @Transform((value) => {
    return value.obj?.wallet ? value.obj?.wallet?.balance : 0;
  })
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
