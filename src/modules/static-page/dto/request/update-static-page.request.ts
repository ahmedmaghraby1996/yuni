import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { StaticPagesEnum } from "src/infrastructure/data/enums/static-pages.enum";

export class UpdateStaticPageRequest {
    @ApiProperty({ description: 'Static page type', enum: StaticPagesEnum, required: true })
    @IsEnum([StaticPagesEnum.ABOUT_US, StaticPagesEnum.TERMS_AND_CONDITIONS, StaticPagesEnum.PRIVACY_POLICY, StaticPagesEnum.RETURN_POLICY])
    @IsString()
    static_page_type: StaticPagesEnum;

    @ApiProperty({ description: 'Static page arabic content', required: false })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    content_ar: string;

    @ApiProperty({ description: 'Static page english content', required: false })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    content_en: string;
}