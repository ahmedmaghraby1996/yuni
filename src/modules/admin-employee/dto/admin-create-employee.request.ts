import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AdminModulePermissionDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() view?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() add?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() edit?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() delete?: boolean;
}

export class AdminEmployeePermissionsDto {
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) users?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) stores?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) employees?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) transactions?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) notifications?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) banners?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) static_pages?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) home?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) analytics?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) packages?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) subcategories?: AdminModulePermissionDto;
  @ApiProperty({ required: false, type: AdminModulePermissionDto }) @IsOptional() @ValidateNested() @Type(() => AdminModulePermissionDto) support_tickets?: AdminModulePermissionDto;
}

export class AdminCreateEmployeeRequest {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() password: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;

  @ApiProperty({ required: false, default: true }) @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true' || value === true) is_active?: boolean;

  @ApiProperty({ required: false, description: 'Assign a role — permissions are inherited from the role' })
  @IsOptional() @IsString() role_id?: string;

  @ApiProperty({ required: false, type: 'string', format: 'binary' })
  @IsOptional()
  avatarFile?: Express.Multer.File;
}
