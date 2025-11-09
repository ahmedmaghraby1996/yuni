import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCityRequest {
    @ApiProperty()
    @IsString()
    @IsOptional()
    name_ar: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    name_en: string;

 

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    order_by: number;


}

export class UpdateCityRequest {

  
    id: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    name_ar: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    name_en: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    order_by: number;

}