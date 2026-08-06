import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsStrongPassword,
  isStrongPassword,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Unique } from 'src/core/validators/unique-constraints.validator';
import { AcademicStage } from 'src/infrastructure/data/enums/academic-stage.enum';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';

export class RegisterRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  // @IsStrongPassword()
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Unique('User')
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @Unique('User')
  email?: string;

  @ApiProperty({ type: 'file', required: false })
  @IsOptional()
  avatarFile: Express.Multer.File;

  @ApiProperty({ default: Role.CLIENT, enum: [Role.CLIENT, Role.STORE] })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;


}
export class RegisterStoreRequest {
  // ─── Account ───────────────────────────────────────────────────────────────
  @ApiProperty() @IsNotEmpty() @IsString() name: string;
  @ApiProperty() @IsNotEmpty() @IsString() password: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Unique('User') phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @Unique('User') email?: string;

  // ─── Store info ────────────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() store_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subcategory_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() first_phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() second_phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsapp_link?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) longitude?: number;
  @ApiPropertyOptional({ enum: ['in_store', 'online', 'both'] })
  @IsOptional() @IsEnum(['in_store', 'online', 'both']) store_type?: 'in_store' | 'online' | 'both';

  // ─── Files (set by controller) ─────────────────────────────────────────────
  @ApiPropertyOptional({ type: 'file' }) @IsOptional() logo?: Express.Multer.File;
  @ApiPropertyOptional({ type: 'file' }) @IsOptional() cover_image?: Express.Multer.File;
  @ApiPropertyOptional({ type: 'file' }) @IsOptional() commercial_registration_file?: Express.Multer.File;
  @ApiPropertyOptional({ type: 'file' }) @IsOptional() vat_certificate_file?: Express.Multer.File;
}

export class AgentRegisterRequest  {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  resume: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city_id: string;



  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cv: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  certificate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bank_account_number: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bank_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bank_branch: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_number: string;


    @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nickname: string;


}
