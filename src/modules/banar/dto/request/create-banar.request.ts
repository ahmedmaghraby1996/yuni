import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBanarRequest {
    @ApiProperty({ type: 'file', required: true })
    banar: Express.Multer.File;

    @ApiProperty({  default: new Date().toISOString().split('T')[0]  })
    @IsNotEmpty()
    started_at: Date;

    @ApiProperty({  default: new Date().toISOString().split('T')[0]  })
    @IsNotEmpty()
    ended_at: Date;

    @ApiProperty({ nullable: true, required: false })
    @IsOptional()
    @Transform(({ value }) => {
        return Number(value);
    })
    @IsNumber()
    order_by: number

    @ApiProperty({ nullable: true, required: false, default: true })
    @IsOptional()
    @Transform((value) => Boolean(value))
    @IsBoolean()
    is_active: boolean;
    
    @ApiProperty({ nullable: true, required: false, default: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    })
    @IsBoolean()
    is_popup: boolean;

    @ApiProperty({ nullable: true, required: false, default: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    })
    @IsBoolean()
    is_general: boolean;



}
