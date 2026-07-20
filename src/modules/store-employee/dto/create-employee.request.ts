import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ModulePermissionDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() view?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() add?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() edit?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() delete?: boolean;
}

export class EmployeePermissionsDto {
  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  dashboard?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  branches?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  offers?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  packages?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  customers?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  employees?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  reports?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  support?: ModulePermissionDto;

  @ApiProperty({ required: false, type: ModulePermissionDto })
  @IsOptional() @ValidateNested() @Type(() => ModulePermissionDto)
  profile?: ModulePermissionDto;
}

export class CreateEmployeeRequest {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() password: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;

  @ApiProperty({ required: false, description: 'Assign a role to auto-fill permissions' })
  @IsOptional() @IsString() role_id?: string;

  @ApiProperty({ required: false, type: EmployeePermissionsDto, description: 'Manual permissions as JSON string — ignored if role_id is provided' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') { try { return JSON.parse(value); } catch { return value; } }
    return value;
  })
  @ValidateNested() @Type(() => EmployeePermissionsDto)
  permissions?: EmployeePermissionsDto;

  @ApiProperty({ required: false, type: 'string', format: 'binary' })
  @IsOptional()
  avatarFile?: Express.Multer.File;
}
