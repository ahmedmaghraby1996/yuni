import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { AdminEmployeeService } from './admin-employee.service';
import { AdminCreateEmployeeRequest } from './dto/admin-create-employee.request';
import { AdminUpdateEmployeeRequest } from './dto/admin-update-employee.request';
import { AdminEmployeeResponse } from './dto/admin-employee.response';
import { CreateAdminRoleRequest, UpdateAdminRoleRequest, AdminEmployeeRoleResponse } from './dto/admin-employee-role.dto';

@ApiTags('Admin Employees')
@AdminEndpoint()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ADMIN_EMPLOYEE)
@Controller('admin/employees')
export class AdminEmployeeController {
  constructor(private readonly service: AdminEmployeeService) {}

  // ─── Permissions ──────────────────────────────────────────────────────────

  @Get('permissions/groups')
  getPermissionGroups() {
    const actions = ['view', 'add', 'edit', 'delete'];
    const modules = ['users', 'stores', 'employees', 'transactions', 'notifications', 'banners', 'static_pages', 'home', 'analytics', 'packages', 'subcategories', 'support_tickets'];
    return new ActionResponse(modules.map((module) => ({ module, actions })));
  }

  @Roles(Role.ADMIN_EMPLOYEE)
  @Get('me/permissions')
  getMyPermissions(@Req() req: Request) {
    return new ActionResponse((req as any).user?.admin_employee_permissions ?? {});
  }

  // ─── Roles ────────────────────────────────────────────────────────────────

  @Post('roles')
  async createRole(@Body() req: CreateAdminRoleRequest) {
    const role = await this.service.createRole(req);
    return new ActionResponse(plainToInstance(AdminEmployeeRoleResponse, role, { excludeExtraneousValues: true }));
  }

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @Get('roles')
  async getRoles(@Query('page') page = 1, @Query('limit') limit = 10, @Query('name') name?: string) {
    const { data, total } = await this.service.getRoles(+page, +limit, name);
    return new PaginatedResponse(
      plainToInstance(AdminEmployeeRoleResponse, data, { excludeExtraneousValues: true }),
      { meta: { total, page: +page, limit: +limit } },
    );
  }

  @Get('roles/:id')
  async getRoleById(@Param('id') id: string) {
    const role = await this.service.getRoleById(id);
    return new ActionResponse(plainToInstance(AdminEmployeeRoleResponse, role, { excludeExtraneousValues: true }));
  }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() req: UpdateAdminRoleRequest) {
    const role = await this.service.updateRole(id, req);
    return new ActionResponse(plainToInstance(AdminEmployeeRoleResponse, role, { excludeExtraneousValues: true }));
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return new ActionResponse(await this.service.deleteRole(id));
  }

  // ─── Employees ────────────────────────────────────────────────────────────

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'is_active', required: false, enum: ['0', '1'] })
  @Get()
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('is_active') is_active?: string,
  ) {
    const isActiveBool = is_active !== undefined && is_active !== '' ? is_active === '1' || is_active === 'true' : undefined;
    const { data, total } = await this.service.getAll(+page, +limit, name, isActiveBool);
    return new PaginatedResponse(
      plainToInstance(AdminEmployeeResponse, data, { excludeExtraneousValues: true }),
      { meta: { total, page: +page, limit: +limit } },
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const employee = await this.service.getById(id);
    return new ActionResponse(
      plainToInstance(AdminEmployeeResponse, employee, { excludeExtraneousValues: true }),
    );
  }

  @Post()
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() req: AdminCreateEmployeeRequest,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) req.avatarFile = avatarFile;
    const employee = await this.service.create(req);
    return new ActionResponse(
      plainToInstance(AdminEmployeeResponse, employee, { excludeExtraneousValues: true }),
    );
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() req: AdminUpdateEmployeeRequest,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) req.avatarFile = avatarFile;
    const employee = await this.service.update(id, req);
    return new ActionResponse(
      plainToInstance(AdminEmployeeResponse, employee, { excludeExtraneousValues: true }),
    );
  }

  @Patch(':id/status')
  async toggleStatus(
    @Param('id') id: string,
    @Query('is_active') is_active: string,
  ) {
    return new ActionResponse(await this.service.toggleStatus(id, is_active === '1' || is_active === 'true'));
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return new ActionResponse(await this.service.delete(id));
  }
}
