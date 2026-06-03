import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsHexColor, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePackageRequest {
  @ApiProperty()
  @IsString()
  name_ar: string;

  @ApiProperty()
  @IsString()
  name_en: string;

  @ApiProperty()
  @IsString()
  description_ar: string;

  @ApiProperty()
  @IsString()
  description_en: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsBoolean()
  is_active: boolean;

  @ApiProperty()
  @IsNumber()
  order_by: number;

  @ApiPropertyOptional({ description: 'Monthly offer limit — omit or null for unlimited' })
  @IsOptional()
  @IsNumber()
  offers_count?: number | null;

  @ApiPropertyOptional({ description: 'Usage codes limit — omit or null for unlimited' })
  @IsOptional()
  @IsNumber()
  codes_count?: number | null;

  @ApiPropertyOptional({ description: 'Branches limit — omit or null for unlimited' })
  @IsOptional()
  @IsNumber()
  branches_count?: number | null;

  @ApiPropertyOptional({ type: [String], description: 'Feature list in Arabic' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features_ar?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Feature list in English' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features_en?: string[];

  @ApiPropertyOptional({ description: 'Badge color e.g. #F5A623' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdatePackageRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name_ar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name_en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description_ar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  order_by?: number;

  @ApiPropertyOptional({ description: 'null = unlimited' })
  @IsOptional()
  @IsNumber()
  offers_count?: number | null;

  @ApiPropertyOptional({ description: 'null = unlimited' })
  @IsOptional()
  @IsNumber()
  codes_count?: number | null;

  @ApiPropertyOptional({ description: 'null = unlimited' })
  @IsOptional()
  @IsNumber()
  branches_count?: number | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features_ar?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features_en?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}
