import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  IsDate,
  IsBoolean,
} from 'class-validator';

export class UpdateOfferRequest {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title_ar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title_en?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description_ar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  start_date?: Date;
   @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  end_date?: Date;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  original_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  offer_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subcategory_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  stores?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  images?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    
    is_active: boolean;
}
export class UpdateAdminOfferRequest {

  id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title_ar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title_en?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description_ar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  start_date?: Date;
   @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  end_date?: Date;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  original_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  offer_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subcategory_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  stores?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  images?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    
    is_active: boolean;
}
