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
import * as sharp from 'sharp';
import { StoreEmployee } from 'src/infrastructure/entities/store/store-employee.entity';
import { StoreEmployeeRole } from 'src/infrastructure/entities/store/store-employee-role.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { CreateEmployeeRequest } from './dto/create-employee.request';
import { UpdateEmployeeRequest } from './dto/update-employee.request';

@Injectable()
export class StoreEmployeeService {
  constructor(
    @InjectRepository(StoreEmployee)
    private readonly repo: Repository<StoreEmployee>,
    @InjectRepository(StoreEmployeeRole)
    private readonly roleRepo: Repository<StoreEmployeeRole>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
  ) {}

  private get ownerId(): string {
    return (this.request.user as any).owner_user_id ?? this.request.user.id;
  }

  private async uploadAvatar(file: Express.Multer.File): Promise<string> {
    const resized = await this.imageManager.resize(file, {
      size: { width: 300, height: 300 },
      options: { fit: sharp.fit.cover, position: sharp.strategy.entropy },
    });
    return this.storageManager.store(
      { buffer: resized, originalname: file.originalname },
      { path: 'avatars' },
    );
  }

  // ─── Employee CRUD ────────────────────────────────────────────────────────

  async createEmployee(req: CreateEmployeeRequest): Promise<StoreEmployee> {
    const existing = await this.userRepo.findOneBy({ phone: req.phone });
    if (existing) throw new BadRequestException('Phone already in use');

    let permissions = {};
    if (req.role_id) {
      const role = await this.roleRepo.findOneBy({ id: req.role_id, owner_user_id: this.ownerId });
      if (!role) throw new NotFoundException('Role not found');
      permissions = role.permissions;
    }

    let avatar: string | undefined;
    if (req.avatarFile) avatar = await this.uploadAvatar(req.avatarFile);

    const hashed = await bcrypt.hash(req.password, 10);
    const user = this.userRepo.create({
      name: req.name,
      phone: req.phone,
      email: req.email,
      password: hashed,
      username: req.phone,
      roles: [Role.EMPLOYEE],
      is_active: true,
      ...(avatar && { avatar }),
    });
    const savedUser = await this.userRepo.save(user);

    const employee = this.repo.create({
      user_id: savedUser.id,
      owner_user_id: this.ownerId,
      permissions,
      is_active: true,
      ...(req.role_id && { role_id: req.role_id }),
    });
    const saved = await this.repo.save(employee);
    return this.repo.findOne({ where: { id: saved.id }, relations: { user: true, role: true } });
  }

  async getEmployees(): Promise<StoreEmployee[]> {
    return this.repo.find({
      where: { owner_user_id: this.ownerId },
      relations: { user: true, role: true },
      order: { created_at: 'DESC' },
    });
  }

  async getEmployeeById(id: string): Promise<StoreEmployee> {
    const employee = await this.repo.findOne({
      where: { id, owner_user_id: this.ownerId },
      relations: { user: true, role: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async updateEmployee(id: string, req: UpdateEmployeeRequest): Promise<StoreEmployee> {
    const employee = await this.repo.findOne({
      where: { id, owner_user_id: this.ownerId },
      relations: { user: true, role: true },
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
    if (req.avatarFile) employee.user.avatar = await this.uploadAvatar(req.avatarFile);

    if (req.role_id) {
      const role = await this.roleRepo.findOneBy({ id: req.role_id, owner_user_id: this.ownerId });
      if (!role) throw new NotFoundException('Role not found');
      employee.role_id = req.role_id;
      employee.permissions = role.permissions;
    }

    await this.userRepo.save(employee.user);
    return this.repo.save(employee);
  }

  async deleteEmployee(id: string): Promise<void> {
    const employee = await this.repo.findOne({
      where: { id, owner_user_id: this.ownerId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    await this.repo.softRemove(employee);
    await this.userRepo.softRemove({ id: employee.user_id } as User);
  }

  // ─── Role CRUD ────────────────────────────────────────────────────────────

  async createRole(req: { name_ar: string; name_en: string; permissions: any }): Promise<StoreEmployeeRole> {
    const role = this.roleRepo.create({
      name_ar: req.name_ar,
      name_en: req.name_en,
      permissions: req.permissions ?? {},
      owner_user_id: this.ownerId,
    });
    return this.roleRepo.save(role);
  }

  async getRoles(): Promise<StoreEmployeeRole[]> {
    return this.roleRepo.find({
      where: { owner_user_id: this.ownerId },
      order: { created_at: 'DESC' },
    });
  }

  async updateRole(id: string, req: { name_ar?: string; name_en?: string; permissions?: any }): Promise<StoreEmployeeRole> {
    const role = await this.roleRepo.findOneBy({ id, owner_user_id: this.ownerId });
    if (!role) throw new NotFoundException('Role not found');
    if (req.name_ar) role.name_ar = req.name_ar;
    if (req.name_en) role.name_en = req.name_en;
    if (req.permissions) role.permissions = req.permissions;
    return this.roleRepo.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepo.findOneBy({ id, owner_user_id: this.ownerId });
    if (!role) throw new NotFoundException('Role not found');
    await this.roleRepo.softRemove(role);
  }
}
