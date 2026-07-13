import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { StoreEmployee } from 'src/infrastructure/entities/store/store-employee.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly _config: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(StoreEmployee) private readonly employeeRepo: Repository<StoreEmployee>,
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

    return user;
  }
}
