import { Expose, Type } from 'class-transformer';
import { EmployeePermissions } from 'src/infrastructure/entities/store/store-employee.entity';

export class EmployeeUserDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() phone: string;
  @Expose() email: string;
  @Expose() is_active: boolean;
}

export class EmployeeResponse {
  @Expose() id: string;
  @Expose() user_id: string;
  @Expose() owner_user_id: string;
  @Expose() is_active: boolean;
  @Expose() permissions: EmployeePermissions;
  @Expose() created_at: Date;

  @Expose()
  @Type(() => EmployeeUserDto)
  user: EmployeeUserDto;
}
