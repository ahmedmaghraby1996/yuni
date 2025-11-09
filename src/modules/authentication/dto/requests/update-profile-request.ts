import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
  first_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Unique('User')
  email?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
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

  @ApiProperty({ type: 'enum', required: false,enum:[Language.EN,Language.AR] })
  @IsEnum(Language)
  @IsOptional()
  language: Language;

  @ApiProperty({required:false})
  @IsString()
  @IsOptional()
  fcm_token: string;

  @ApiProperty({required:false})
  @IsString()
  @IsOptional()
  city_id: string;
}
