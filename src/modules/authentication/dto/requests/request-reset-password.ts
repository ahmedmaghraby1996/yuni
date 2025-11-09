import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RequestResetPassword {
    @ApiProperty({ required: true, description: 'Authentication email', example: 'ahmed@gmail.com'})
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;
}