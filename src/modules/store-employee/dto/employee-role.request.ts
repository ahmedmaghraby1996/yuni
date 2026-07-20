import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { EmployeePermissionsDto } from './create-employee.request';

export class CreateEmployeeRoleRequest {
  @ApiProperty() @IsString() name_ar: string;
  @ApiProperty() @IsString() name_en: string;

  @ApiProperty({ type: EmployeePermissionsDto })
  @ValidateNested() @Type(() => EmployeePermissionsDto)
  permissions: EmployeePermissionsDto;
}

export class UpdateEmployeeRoleRequest {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name_ar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() name_en?: string;

  @ApiProperty({ required: false, type: EmployeePermissionsDto })
  @IsOptional() @ValidateNested() @Type(() => EmployeePermissionsDto)
  permissions?: EmployeePermissionsDto;
}
