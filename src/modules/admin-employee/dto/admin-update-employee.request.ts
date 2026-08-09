import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AdminEmployeePermissionsDto } from './admin-create-employee.request';

export class AdminUpdateEmployeeRequest {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() password?: string;

  @ApiProperty({ required: false, type: AdminEmployeePermissionsDto })
  @IsOptional() @ValidateNested() @Type(() => AdminEmployeePermissionsDto)
  permissions?: AdminEmployeePermissionsDto;

  @ApiProperty({ required: false, type: 'string', format: 'binary' })
  @IsOptional()
  avatarFile?: Express.Multer.File;
}
