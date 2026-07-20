import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEmployeeRequest {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() password?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true' || value === true) is_active?: boolean;

  @ApiProperty({ required: false, description: 'Assign a role — permissions are taken from the role' })
  @IsOptional() @IsString() role_id?: string;

  @ApiProperty({ required: false, type: 'string', format: 'binary' })
  @IsOptional()
  avatarFile?: Express.Multer.File;
}
