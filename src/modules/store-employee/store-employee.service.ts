import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { StoreEmployee } from 'src/infrastructure/entities/store/store-employee.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { CreateEmployeeRequest } from './dto/create-employee.request';
import { UpdateEmployeeRequest } from './dto/update-employee.request';

@Injectable()
export class StoreEmployeeService {
  constructor(
    @InjectRepository(StoreEmployee)
    private readonly repo: Repository<StoreEmployee>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async createEmployee(req: CreateEmployeeRequest): Promise<StoreEmployee> {
    const existing = await this.userRepo.findOneBy({ phone: req.phone });
    if (existing) throw new BadRequestException('Phone already in use');

    const hashed = await bcrypt.hash(req.password, 10);
    const user = this.userRepo.create({
      name: req.name,
      phone: req.phone,
      email: req.email,
      password: hashed,
      username: req.phone,
      roles: [Role.EMPLOYEE],
      is_active: true,
    });
    const savedUser = await this.userRepo.save(user);

    const employee = this.repo.create({
      user_id: savedUser.id,
      owner_user_id: this.request.user.id,
      permissions: req.permissions ?? {},
      is_active: true,
    });
    return this.repo.save(employee);
  }

  async getEmployees(): Promise<StoreEmployee[]> {
    return this.repo.find({
      where: { owner_user_id: this.request.user.id },
      relations: { user: true },
      order: { created_at: 'DESC' },
    });
  }

  async getEmployeeById(id: string): Promise<StoreEmployee> {
    const employee = await this.repo.findOne({
      where: { id, owner_user_id: this.request.user.id },
      relations: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async updateEmployee(id: string, req: UpdateEmployeeRequest): Promise<StoreEmployee> {
    const employee = await this.repo.findOne({
      where: { id, owner_user_id: this.request.user.id },
      relations: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    if (req.name) employee.user.name = req.name;
    if (req.phone) employee.user.phone = req.phone;
    if (req.email) employee.user.email = req.email;
    if (req.password) employee.user.password = await bcrypt.hash(req.password, 10);
    if (req.is_active !== undefined) {
      employee.is_active = req.is_active;
      employee.user.is_active = req.is_active;
    }
    if (req.permissions) employee.permissions = req.permissions;

    await this.userRepo.save(employee.user);
    return this.repo.save(employee);
  }

  async deleteEmployee(id: string): Promise<void> {
    const employee = await this.repo.findOne({
      where: { id, owner_user_id: this.request.user.id },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    await this.repo.softRemove(employee);
    await this.userRepo.softRemove({ id: employee.user_id } as User);
  }
}
