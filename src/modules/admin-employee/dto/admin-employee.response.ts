import { Expose, Transform, Type } from 'class-transformer';
import { AdminEmployeePermissions } from 'src/infrastructure/entities/admin/admin-employee.entity';
import { toUrl } from 'src/core/helpers/file.helper';

export class AdminEmployeeUserDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() phone: string;
  @Expose() email: string;
  @Expose() @Transform(({ value }) => toUrl(value)) avatar: string;
}

export class AdminEmployeeResponse {
  @Expose() id: string;
  @Expose() user_id: string;
  @Expose() is_active: boolean;
  @Expose() permissions: AdminEmployeePermissions;
  @Expose() created_at: Date;

  @Expose() @Type(() => AdminEmployeeUserDto) user: AdminEmployeeUserDto;
}
