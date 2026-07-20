import { Expose, Transform, Type } from 'class-transformer';
import { EmployeePermissions } from 'src/infrastructure/entities/store/store-employee.entity';
import { toUrl } from 'src/core/helpers/file.helper';

export class EmployeeRoleDto {
  @Expose() id: string;
  @Expose() name_ar: string;
  @Expose() name_en: string;
  @Expose() permissions: EmployeePermissions;
}

export class EmployeeUserDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() phone: string;
  @Expose() email: string;
  @Expose() is_active: boolean;
  @Expose() @Transform(({ value }) => toUrl(value)) avatar: string;
}

export class EmployeeResponse {
  @Expose() id: string;
  @Expose() user_id: string;
  @Expose() owner_user_id: string;
  @Expose() is_active: boolean;
  @Expose() role_id: string;
  @Expose() permissions: EmployeePermissions;
  @Expose() created_at: Date;

  @Expose()
  @Type(() => EmployeeUserDto)
  user: EmployeeUserDto;

  @Expose()
  @Type(() => EmployeeRoleDto)
  role: EmployeeRoleDto;
}
