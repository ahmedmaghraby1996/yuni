import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose } from 'class-transformer';
import { AdminEmployeePermissions } from 'src/infrastructure/entities/admin/admin-employee.entity';
import { AdminEmployeePermissionsDto } from './admin-create-employee.request';

export class CreateAdminRoleRequest {
  @ApiProperty() @IsString() name_ar: string;
  @ApiProperty() @IsString() name_en: string;

  @ApiProperty({ required: false, type: AdminEmployeePermissionsDto })
  @IsOptional() @ValidateNested() @Type(() => AdminEmployeePermissionsDto)
  permissions?: AdminEmployeePermissionsDto;
}

export class UpdateAdminRoleRequest {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name_ar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() name_en?: string;

  @ApiProperty({ required: false, type: AdminEmployeePermissionsDto })
  @IsOptional() @ValidateNested() @Type(() => AdminEmployeePermissionsDto)
  permissions?: AdminEmployeePermissionsDto;
}

export class AdminEmployeeRoleResponse {
  @Expose() id: string;
  @Expose() name_ar: string;
  @Expose() name_en: string;
  @Expose() permissions: AdminEmployeePermissions;
  @Expose() created_at: Date;
}
