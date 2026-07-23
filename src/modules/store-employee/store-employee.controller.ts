import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Permission } from '../authentication/guards/permission.decorator';
import { CreateEmployeeRequest } from './dto/create-employee.request';
import { UpdateEmployeeRequest } from './dto/update-employee.request';
import { CreateEmployeeRoleRequest, UpdateEmployeeRoleRequest } from './dto/employee-role.request';
import { EmployeeResponse, EmployeeRoleDto } from './dto/employee.response';
import { StoreEmployeeService } from './store-employee.service';

@ApiTags('Store Employees')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store/employees')
export class StoreEmployeeController {
  constructor(private readonly service: StoreEmployeeService) {}

  // ─── Permission Groups ─────────────────────────────────────────────────────

  @StoreEndpoint()
  @Roles(Role.STORE)
  @ApiOperation({ summary: 'Get all permission modules and their available actions' })
  @Get('permissions/groups')
  getPermissionGroups() {
    const actions = ['view', 'add', 'edit', 'delete'];
    const groups = [
      'dashboard', 'branches', 'offers', 'packages',
      'customers', 'employees', 'reports', 'support', 'profile',
    ].map((module) => ({ module, actions }));
    return new ActionResponse(groups);
  }

  // ─── Employee Roles ────────────────────────────────────────────────────────

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'add')
  @ApiOperation({ summary: 'Create an employee role with preset permissions' })
  @Post('roles')
  async createRole(@Body() req: CreateEmployeeRoleRequest) {
    const role = await this.service.createRole(req);
    return new ActionResponse(plainToInstance(EmployeeRoleDto, role, { excludeExtraneousValues: true }));
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'view')
  @ApiOperation({ summary: 'Get all employee roles for this store' })
  @Get('roles')
  async getRoles() {
    const roles = await this.service.getRoles();
    return new ActionResponse(plainToInstance(EmployeeRoleDto, roles, { excludeExtraneousValues: true }));
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'edit')
  @ApiOperation({ summary: 'Update an employee role' })
  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() req: UpdateEmployeeRoleRequest) {
    const role = await this.service.updateRole(id, req);
    return new ActionResponse(plainToInstance(EmployeeRoleDto, role, { excludeExtraneousValues: true }));
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'delete')
  @ApiOperation({ summary: 'Delete an employee role' })
  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    await this.service.deleteRole(id);
    return new ActionResponse(true);
  }

  // ─── Employees ─────────────────────────────────────────────────────────────

  @StoreEndpoint()
  @Roles(Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get my permissions (employee only)' })
  @Get('me/permissions')
  async getMyPermissions() {
    return new ActionResponse(await this.service.getMyPermissions());
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'add')
  @ApiOperation({ summary: 'Create a new employee for the store' })
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @Post()
  async create(
    @Body() req: CreateEmployeeRequest,
    @UploadedFile(new UploadValidator().build()) avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) req.avatarFile = avatarFile;
    const employee = await this.service.createEmployee(req);
    return new ActionResponse(
      plainToInstance(EmployeeResponse, employee, { excludeExtraneousValues: true }),
    );
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'view')
  @ApiOperation({ summary: 'Get all employees of the store' })
  @Get()
  async getAll() {
    const employees = await this.service.getEmployees();
    return new ActionResponse(
      plainToInstance(EmployeeResponse, employees, { excludeExtraneousValues: true }),
    );
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'view')
  @ApiOperation({ summary: 'Get employee by ID' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const employee = await this.service.getEmployeeById(id);
    return new ActionResponse(
      plainToInstance(EmployeeResponse, employee, { excludeExtraneousValues: true }),
    );
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'edit')
  @ApiOperation({ summary: 'Update employee info, avatar, or permissions' })
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() req: UpdateEmployeeRequest,
    @UploadedFile(new UploadValidator().build()) avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) req.avatarFile = avatarFile;
    const employee = await this.service.updateEmployee(id, req);
    return new ActionResponse(
      plainToInstance(EmployeeResponse, employee, { excludeExtraneousValues: true }),
    );
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'delete')
  @ApiOperation({ summary: 'Delete an employee' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.deleteEmployee(id);
    return new ActionResponse(true);
  }
}
