import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class AddSecurityGradeRequest {
    @ApiProperty()
    @IsString()
    user_id: string

    @ApiProperty({ isArray: true, type: 'array' })
    @IsArray()
    @IsString({ each: true })
    grades_ids: string[]

    
}