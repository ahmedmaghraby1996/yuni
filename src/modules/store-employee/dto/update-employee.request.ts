import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EmployeePermissionsDto } from './create-employee.request';

export class UpdateEmployeeRequest {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() password?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() is_active?: boolean;

  @ApiProperty({ required: false, type: EmployeePermissionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeePermissionsDto)
  permissions?: EmployeePermissionsDto;
}
