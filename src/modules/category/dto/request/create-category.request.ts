import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCategoryRequest {
  @ApiProperty()
  @IsString()
  name_ar: string;

  @ApiProperty()
  @IsString()
  name_en: string;

   @ApiProperty({ type: 'file', required: false })
    @IsOptional()
    logo: Express.Multer.File;

      @ApiProperty({required:false})
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => Number(value))
    order_by: number;

    @ApiProperty({required:false})
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    is_active: boolean
}

export class UpdateCategoryRequest{
    @ApiProperty(
        {required:false}
    )
    @IsString()
    @IsOptional()
    name_ar: string;
  
    @ApiProperty( {required:false})
    @IsString()
    @IsOptional()
    name_en: string;
  
    @ApiProperty({ type: 'file', required: false })
    @IsOptional()
    logo: Express.Multer.File;

    @ApiProperty({required:false})
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => Number(value))
    order_by: number;

    @ApiProperty({required:false})
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    is_active: boolean
}

export class CreateSubCategoryRequest extends CreateCategoryRequest {
  @ApiProperty()
  @IsString()
  category_id: string;
}

export class UpdateSubCategoryRequest extends UpdateCategoryRequest {
  @ApiProperty({required:false})
  @IsString()
  @IsOptional()
  category_id: string;
}