//notification response dto

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { toUrl } from 'src/core/helpers/file.helper';
import { User } from 'src/infrastructure/entities/user/user.entity';

export class NotificationResponse {
  @Expose() id: string;

  @Expose() title: string;
  
  @Expose() title_ar: string;
  @Expose() title_en: string;

  @Expose() text: string;
  
  @Expose() text_ar: string;
  
  @Expose() text_en: string;

  @Expose() url: string;

  @Expose() type: string;

  @Expose() is_read: boolean;

  @Expose() seen_at: Date;

  @Expose() created_at: Date;

  @Expose() role: string;

  @Transform((value) => {
    
    value.obj.users= value.obj.users?.map((user)=>{ return {
      id: user.id,
      avatar: toUrl(user.avatar),
      name:user.name,
    };})
    return value.obj.users;
    })
  @Expose()
  users: User[];
}
