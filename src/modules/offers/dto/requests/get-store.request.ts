import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetStoreRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lng?: string;

  @ApiPropertyOptional({ enum: ['in_store', 'online', 'both'] })
  @IsOptional()
  @IsEnum(['in_store', 'online', 'both'])
  store_type?: 'in_store' | 'online' | 'both';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sub_category_id?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  recommend?: boolean;
}
