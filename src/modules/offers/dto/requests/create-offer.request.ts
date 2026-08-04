import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';

export class CreateOfferRequest {

  @ApiProperty()
  title_ar: string;
  @ApiProperty()
  title_en: string;
  @ApiProperty()
  description_ar: string;
  @ApiProperty()
  subcategory_id: string;
  @ApiProperty()
  description_en: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  start_date: Date;
   @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  end_date?: Date;
  @ApiProperty()
  original_price: number;
  @ApiProperty()
  offer_price: number;
  @ApiProperty({ required: false, description: 'If true, store provides a fixed code manually. If false, backend auto-generates a one-time code on each response.' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_fixed_code: boolean;

  @ApiProperty({ required: false, description: 'Required only if is_fixed_code is true' })
  @IsOptional()
  code: string;
  @ApiProperty({ required: false, description: 'Specific branch IDs to link. Ignored if all_branches is true.' })
  @IsOptional()
  stores: string[];

  @ApiProperty({ required: false, description: 'If true, offer is linked to all store branches automatically' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  all_branches: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  images: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  
  is_active: boolean;
}
