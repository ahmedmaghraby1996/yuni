import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { StoreEmployee } from 'src/infrastructure/entities/store/store-employee.entity';
import { AdminEmployee } from 'src/infrastructure/entities/admin/admin-employee.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly _config: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(StoreEmployee) private readonly employeeRepo: Repository<StoreEmployee>,
    @InjectRepository(AdminEmployee) private readonly adminEmployeeRepo: Repository<AdminEmployee>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: _config.get('app.key'),
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException();

    if (user.roles.includes(Role.EMPLOYEE)) {
      const employee = await this.employeeRepo.findOneBy({ user_id: user.id, is_active: true });
      if (!employee) throw new UnauthorizedException('Employee account is inactive');
      (user as any).owner_user_id = employee.owner_user_id;
      (user as any).employee_permissions = employee.permissions;
      (user as any).employee_id = employee.id;
    }

    if (user.roles.includes(Role.ADMIN_EMPLOYEE)) {
      const adminEmployee = await this.adminEmployeeRepo.findOneBy({ user_id: user.id, is_active: true });
      if (!adminEmployee) throw new UnauthorizedException('Admin employee account is inactive');
      (user as any).admin_employee_permissions = adminEmployee.permissions;
      (user as any).admin_employee_id = adminEmployee.id;
    }

    return user;
  }
}
