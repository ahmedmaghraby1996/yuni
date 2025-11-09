import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/infrastructure/data/enums/role.enum';

export class SendToUsersNotificationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  users_id: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_en: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_en: string;

  constructor(partial: Partial<SendToUsersNotificationRequest>) {
    Object.assign(this, partial);
  }
}

export class SendToAllUsersNotificationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_en: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_en: string;

  @ApiProperty({
    enum: [ Role.CLIENT, Role.STORE, Role.ADMIN ],
  })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

  @ApiProperty({required:false})
  @IsNotEmpty()
  @IsOptional()
  @IsArray()
  users_id: string[];
constructor(partial: Partial<SendToAllUsersNotificationRequest>) {
  Object.assign(this, partial);
}

}
