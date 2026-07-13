import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (user.is_active == false)
      throw new UnauthorizedException('message.user_inactive');

    // Employees inherit STORE access
    if (user.roles?.includes(Role.EMPLOYEE) && requiredRoles.includes(Role.STORE)) {
      return true;
    }

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
