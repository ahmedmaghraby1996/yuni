import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsBoolean, IsOptional } from "class-validator"

export class CreateFaqRequest {
    @ApiProperty()
    title_ar:string
    @ApiProperty()
    title_en:string
    @ApiProperty()
    descrption_ar:string
    @ApiProperty()
    descrption_en:string
    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active: boolean
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
    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active: boolean
}