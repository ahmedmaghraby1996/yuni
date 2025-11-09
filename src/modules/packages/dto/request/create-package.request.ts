import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePackageRequest {
  @ApiProperty()
  @IsString()
  name_ar: string

  @ApiProperty()
  @IsString()
  name_en: string

  @ApiProperty()
  @IsBoolean()
  is_active: boolean

  @ApiProperty()
  @IsString()
  description_ar: string

  @ApiProperty()
  @IsString()
  description_en: string

  @ApiProperty()
  @IsNumber()
  price: number

  @ApiProperty()
  @IsNumber()
  duration: number

  @ApiProperty()
  @IsNumber()
  order_by: number

}

export class UpdatePackageRequest {

  
    @ApiPropertyOptional()
    @IsString()
    name_ar: string

    @ApiPropertyOptional()
    @IsString()
      @IsOptional()
    name_en: string

    @ApiPropertyOptional()
    @IsBoolean()
      @IsOptional()
    is_active: boolean

    @ApiPropertyOptional()
    @IsString()
      @IsOptional()
    description_ar: string

    @ApiPropertyOptional()
    @IsString()
      @IsOptional()
    description_en: string

    @ApiPropertyOptional()
    @IsNumber()
      @IsOptional()
    price: number

    @ApiPropertyOptional()
    @IsNumber()
      @IsOptional()
    duration: number



    @ApiPropertyOptional()
    @IsNumber()
      @IsOptional()
    order_by: number
}