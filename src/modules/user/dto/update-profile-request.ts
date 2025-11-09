import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Unique } from 'src/core/validators/unique-constraints.validator';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Language } from 'src/infrastructure/data/enums/language.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';

export class UpdateProfileRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Unique('User')
  email?: string;
  @ApiPropertyOptional()
  @IsOptional()
  birth_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty({ default: Gender.MALE, enum: [Gender.MALE, Gender.FEMALE] })
  @IsEnum(Gender)
  gender: Gender;
  @ApiPropertyOptional()
  @IsOptional()
  @Unique('User')
  phone: string;

  @ApiProperty({ type: 'file', required: false })
  @IsOptional()
  avatarFile: Express.Multer.File;

  @ApiProperty({
    type: 'enum',
    required: false,
    enum: [Language.EN, Language.AR],
  })
  // @IsEnum(Language)
  @IsOptional()
  language: Language;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fcm_token: string;

  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean()
  is_active?: boolean;


  // @ApiProperty({required:false})
  // @Transform(({ value }) => value.split(','))
  // @IsOptional()
  // premessions: string[]
}
