import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Role } from "src/infrastructure/data/enums/role.enum";

export class LoginRequest {
    @ApiProperty()
    @IsNotEmpty() @IsString()
    username: string;

    @ApiProperty()
    @IsNotEmpty() @IsString()
    password: string;
}

export class GoogleSigninRequest {
    @ApiProperty()
    @IsNotEmpty() @IsString()
    token: string;

    // @ApiProperty({ default: Role.PARENT, enum: [Role.PARENT, Role.SECURITY,Role.DRIVER ,Role.School], required: false })
    // @IsNotEmpty()
    // @IsOptional()
    // @IsEnum(Role)
    // role: Role;
}