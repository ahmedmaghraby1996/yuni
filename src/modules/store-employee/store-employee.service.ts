import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import * as sharp from 'sharp';
import { EmployeePermissions, StoreEmployee } from 'src/infrastructure/entities/store/store-employee.entity';
import { StoreEmployeeRole } from 'src/infrastructure/entities/store/store-employee-role.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Package } from 'src/infrastructure/entities/package/package.entity';
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
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
    private readonly config: ConfigService,
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
    const now = new Date();
    const subscription = await this.subscriptionRepo.findOne({
      where: { user_id: this.ownerId },
      order: { created_at: 'DESC' },
    });
    if (subscription) {
      const pkg = await this.packageRepo.findOneBy({ id: subscription.package_id });
      if (pkg?.employees_count != null) {
        const currentCount = await this.repo.count({ where: { owner_user_id: this.ownerId } });
        if (currentCount >= pkg.employees_count) {
          throw new BadRequestException('message.employee_limit_reached');
        }
      }
    }

    const existing = await this.userRepo.findOneBy({ phone: req.phone });
    if (existing) throw new BadRequestException('Phone already in use');

    if (req.email) {
      const emailExists = await this.userRepo.findOneBy({ email: req.email });
      if (emailExists) throw new BadRequestException('Email already in use');
    }

    let permissions = {};
    if (req.role_id) {
      const role = await this.roleRepo.findOneBy({ id: req.role_id, owner_user_id: this.ownerId });
      if (!role) throw new NotFoundException('Role not found');
      permissions = role.permissions;
    }

    let avatar: string | undefined;
    if (req.avatarFile) avatar = await this.uploadAvatar(req.avatarFile);

    const hashed = await bcrypt.hash(req.password + this.config.get('app.key'), 10);
    const user = this.userRepo.create({
      name: req.name,
      phone: req.phone,
      email: req.email,
      password: hashed,
      username: req.phone ?? req.email,
      roles: [Role.EMPLOYEE],
      status: (req.is_active ?? true) ? 'active' : 'deactivated',
      email_verified_at: new Date(),
      ...(avatar && { avatar }),
    });
    const savedUser = await this.userRepo.save(user);

    const employee = this.repo.create({
      user_id: savedUser.id,
      owner_user_id: this.ownerId,
      permissions,
      is_active: req.is_active ?? true,
      ...(req.role_id && { role_id: req.role_id }),
    });
    const saved = await this.repo.save(employee);
    return this.repo.findOne({ where: { id: saved.id }, relations: { user: true, role: true } });
  }

  async getMyPermissions(): Promise<EmployeePermissions> {
    const userId = this.request.user.id;
    const employee = await this.repo.findOne({
      where: { user_id: userId },
      relations: { role: true },
    });
    if (!employee) return {};
    return employee.permissions ?? {};
  }

  async getEmployees(page = 1, limit = 10, name?: string, is_active?: boolean): Promise<{ data: StoreEmployee[]; total: number }> {
    const qb = this.repo.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.role', 'role')
      .where('employee.owner_user_id = :ownerId', { ownerId: this.ownerId })
      .orderBy('employee.created_at', 'DESC');

    if (name) qb.andWhere('user.name LIKE :name', { name: `%${name}%` });
    if (is_active !== undefined) qb.andWhere('employee.is_active = :is_active', { is_active });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
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
    if (req.password) employee.user.password = await bcrypt.hash(req.password + this.config.get('app.key'), 10);
    if (req.is_active !== undefined) {
      employee.is_active = req.is_active;
      employee.user.status = req.is_active ? 'active' : 'deactivated';
    }
    if (req.avatarFile) employee.user.avatar = await this.uploadAvatar(req.avatarFile);

    if (req.role_id) {
      const role = await this.roleRepo.findOneBy({ id: req.role_id, owner_user_id: this.ownerId });
      if (!role) throw new NotFoundException('Role not found');
      employee.role_id = req.role_id;
      employee.permissions = role.permissions;
      employee.role = role;
    }

    await this.userRepo.save(employee.user);
    await this.repo.save(employee);
    return this.repo.findOne({ where: { id: employee.id }, relations: { user: true, role: true } });
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

  async getRoles(page = 1, limit = 10, name?: string): Promise<{ data: StoreEmployeeRole[]; total: number }> {
    const qb = this.roleRepo.createQueryBuilder('role')
      .where('role.owner_user_id = :ownerId', { ownerId: this.ownerId })
      .orderBy('role.created_at', 'DESC');

    if (name) qb.andWhere('(role.name_ar LIKE :name OR role.name_en LIKE :name)', { name: `%${name}%` });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
  }

  async getRoleById(id: string): Promise<StoreEmployeeRole> {
    const role = await this.roleRepo.findOneBy({ id, owner_user_id: this.ownerId });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async updateRole(id: string, req: { name_ar?: string; name_en?: string; permissions?: any }): Promise<StoreEmployeeRole> {
    const role = await this.roleRepo.findOneBy({ id, owner_user_id: this.ownerId });
    if (!role) throw new NotFoundException('Role not found');
    if (req.name_ar) role.name_ar = req.name_ar;
    if (req.name_en) role.name_en = req.name_en;
    if (req.permissions) {
      role.permissions = req.permissions;
      // sync permissions to all employees assigned this role
      await this.repo.update({ role_id: id, owner_user_id: this.ownerId }, { permissions: req.permissions });
    }
    return this.roleRepo.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepo.findOneBy({ id, owner_user_id: this.ownerId });
    if (!role) throw new NotFoundException('Role not found');
    await this.roleRepo.softRemove(role);
  }
}
