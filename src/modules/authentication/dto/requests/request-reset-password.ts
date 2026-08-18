import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RequestResetPassword {
    @ApiProperty({ required: true, description: 'Authentication email', example: 'ahmed@gmail.com'})
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({ required: false, description: 'Portal type: admin, merchant, or omit for mobile web', enum: ['admin', 'merchant'], example: 'admin' })
    @IsOptional()
    @IsEnum(['admin', 'merchant'])
    type?: 'admin' | 'merchant';
}

export class ForgotPasswordRequestOtpRequest {
    @ApiProperty({ description: 'Phone or email', example: '+966555554444' })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({ description: 'Type: phone or email', enum: ['phone', 'email'], default: 'phone' })
    @IsOptional()
    @IsEnum(['phone', 'email'])
    type: 'phone' | 'email' = 'phone';
}

export class ForgotPasswordVerifyOtpRequest {
    @ApiProperty({ description: 'Phone or email used when requesting OTP', example: '+966555554444' })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({ description: 'Type: phone or email', enum: ['phone', 'email'], default: 'phone' })
    @IsOptional()
    @IsEnum(['phone', 'email'])
    type: 'phone' | 'email' = 'phone';

    @ApiProperty({ description: 'OTP code', example: '1234' })
    @IsNotEmpty()
    @IsString()
    code: string;
}

export class ForgotPasswordResetRequest {
    @ApiProperty({ description: 'Reset token from verify-otp step' })
    @IsNotEmpty()
    @IsString()
    reset_token: string;

    @ApiProperty({ description: 'New password' })
    @IsNotEmpty()
    @IsString()
    new_password: string;
}