import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Permission } from '../authentication/guards/permission.decorator';
import { CreateEmployeeRequest } from './dto/create-employee.request';
import { UpdateEmployeeRequest } from './dto/update-employee.request';
import { EmployeeResponse } from './dto/employee.response';
import { StoreEmployeeService } from './store-employee.service';

@ApiTags('Store Employees')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store/employees')
export class StoreEmployeeController {
  constructor(private readonly service: StoreEmployeeService) {}

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('employees', 'add')
  @ApiOperation({ summary: 'Create a new employee for the store' })
  @Post()
  async create(@Body() req: CreateEmployeeRequest) {
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
  @ApiOperation({ summary: 'Update employee info or permissions' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() req: UpdateEmployeeRequest) {
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
