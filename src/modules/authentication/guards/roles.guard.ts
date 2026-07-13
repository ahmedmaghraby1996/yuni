import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ROLES_KEY } from './roles.decorator';
import { PERMISSION_KEY } from './permission.decorator';

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

    // Employees inherit STORE access but are then checked against their permissions
    if (user.roles?.includes(Role.EMPLOYEE) && requiredRoles.includes(Role.STORE)) {
      const required = this.reflector.getAllAndOverride<{ module: string; action: string }>(
        PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

      // If endpoint has no @Permission() decorator, employees are blocked by default
      if (!required) {
        throw new ForbiddenException('message.permission_denied');
      }

      const perms = (user as any).employee_permissions ?? {};
      const modulePerms = perms[required.module] ?? {};
      if (!modulePerms[required.action]) {
        throw new ForbiddenException('message.permission_denied');
      }

      return true;
    }

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
