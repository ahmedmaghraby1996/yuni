import { ApiProperty } from "@nestjs/swagger"
import { IsOptional } from "class-validator"

export class CreateFaqRequest {
    @ApiProperty()
    title_ar:string
    @ApiProperty()
    title_en:string
    @ApiProperty()
    descrption_ar:string
    @ApiProperty()
    descrption_en:string
}

export class UpdateFaqRequest{
    @ApiProperty({required:false})
    @IsOptional()
    title_ar:string
    @ApiProperty({required:false})
    @IsOptional()
    title_en:string
    @ApiProperty({required:false})
    @IsOptional()
    descrption_ar:string
    @ApiProperty({required:false})
    @IsOptional()
    descrption_en:string


}