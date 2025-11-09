import { IsBoolean, IsDateString, IsNumber, IsOptional } from "class-validator";
import { CreateBanarRequest } from "./create-banar.request";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class UpdateBannerRequest {
    @ApiProperty({ type: 'file', required: false })
    banar: Express.Multer.File;

    @ApiProperty({ default: new Date().toISOString().split('T')[0], required: false })
    @IsOptional()
    started_at: Date;

      @ApiProperty({ nullable: true, required: false })
        @IsOptional()
            @Transform(({ value }) => {
                return Number(value);
            })
        @IsNumber()
        order_by: number

    @ApiProperty({ default: new Date().toISOString().split('T')[0], required: false })
    @IsOptional()
    ended_at: Date;

    @ApiProperty({ nullable: true, required: false, default: true })
    @IsOptional()
    @Transform(({ value }) => {
        return value === true || value === 'true';
    })
    @IsBoolean()
    is_active: boolean;

}