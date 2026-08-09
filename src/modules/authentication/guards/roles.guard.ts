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
import { ADMIN_PERMISSION_KEY } from './admin-permission.decorator';

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
    if (user.status === 'deactivated' || user.status === 'pending')
      throw new UnauthorizedException('message.user_inactive');

    // Normalize roles — MySQL SET type may return a comma-separated string
    if (typeof user.roles === 'string') {
      user.roles = (user.roles as string).split(',').map((r) => r.trim());
    }

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

    // Admin employees inherit ADMIN access but are checked against their permissions
    if (user.roles?.includes(Role.ADMIN_EMPLOYEE) && requiredRoles.includes(Role.ADMIN)) {
      const required = this.reflector.getAllAndOverride<{ module: string; action: string }>(
        ADMIN_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!required) throw new ForbiddenException('message.permission_denied');

      const perms = (user as any).admin_employee_permissions ?? {};
      const modulePerms = perms[required.module] ?? {};
      if (!modulePerms[required.action]) throw new ForbiddenException('message.permission_denied');

      return true;
    }

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
