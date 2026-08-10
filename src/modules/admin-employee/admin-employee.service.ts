import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as sharp from 'sharp';
import { AdminEmployee, AdminEmployeePermissions } from 'src/infrastructure/entities/admin/admin-employee.entity';
import { AdminEmployeeRole } from 'src/infrastructure/entities/admin/admin-employee-role.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { AdminCreateEmployeeRequest } from './dto/admin-create-employee.request';
import { AdminUpdateEmployeeRequest } from './dto/admin-update-employee.request';
import { CreateAdminRoleRequest, UpdateAdminRoleRequest } from './dto/admin-employee-role.dto';

@Injectable()
export class AdminEmployeeService {
  constructor(
    @InjectRepository(AdminEmployee) private readonly repo: Repository<AdminEmployee>,
    @InjectRepository(AdminEmployeeRole) private readonly roleRepo: Repository<AdminEmployeeRole>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
    private readonly config: ConfigService,
  ) {}

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

  // ─── Roles ────────────────────────────────────────────────────────────────

  async createRole(req: CreateAdminRoleRequest) {
    const role = this.roleRepo.create({ name_ar: req.name_ar, name_en: req.name_en, permissions: req.permissions ?? {} });
    return this.roleRepo.save(role);
  }

  async getRoles(page = 1, limit = 10, name?: string) {
    const qb = this.roleRepo.createQueryBuilder('r').orderBy('r.created_at', 'DESC');
    if (name) qb.andWhere('(r.name_ar LIKE :name OR r.name_en LIKE :name)', { name: `%${name}%` });
    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
  }

  async getRoleById(id: string) {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async updateRole(id: string, req: UpdateAdminRoleRequest) {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new NotFoundException('Role not found');
    if (req.name_ar) role.name_ar = req.name_ar;
    if (req.name_en) role.name_en = req.name_en;
    if (req.permissions) {
      role.permissions = req.permissions;
      await this.repo.update({ role_id: id }, { permissions: req.permissions });
    }
    return this.roleRepo.save(role);
  }

  async deleteRole(id: string) {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new NotFoundException('Role not found');
    await this.roleRepo.softRemove(role);
    return true;
  }

  // ─── Employees ────────────────────────────────────────────────────────────

  async getAll(page = 1, limit = 10, name?: string, is_active?: boolean) {
    const qb = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'user')
      .leftJoinAndSelect('e.role', 'role')
      .orderBy('e.created_at', 'DESC');

    if (name) qb.andWhere('user.name LIKE :name', { name: `%${name}%` });
    if (is_active !== undefined) qb.andWhere('e.is_active = :is_active', { is_active });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
  }

  async getById(id: string) {
    const employee = await this.repo.findOne({ where: { id }, relations: { user: true, role: true } });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(req: AdminCreateEmployeeRequest) {
    const phoneExists = await this.userRepo.findOneBy({ phone: req.phone });
    if (phoneExists) throw new BadRequestException('Phone already in use');

    if (req.email) {
      const emailExists = await this.userRepo.findOneBy({ email: req.email });
      if (emailExists) throw new BadRequestException('Email already in use');
    }

    let permissions: AdminEmployeePermissions = {};
    if (req.role_id) {
      const role = await this.roleRepo.findOneBy({ id: req.role_id });
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
      roles: [Role.ADMIN_EMPLOYEE],
      status: (req.is_active ?? true) ? 'active' : 'deactivated',
      email_verified_at: new Date(),
      ...(avatar && { avatar }),
    });
    const savedUser = await this.userRepo.save(user);

    const employee = this.repo.create({
      user_id: savedUser.id,
      permissions,
      is_active: req.is_active ?? true,
      ...(req.role_id && { role_id: req.role_id }),
    });
    const saved = await this.repo.save(employee);
    return this.repo.findOne({ where: { id: saved.id }, relations: { user: true, role: true } });
  }

  async update(id: string, req: AdminUpdateEmployeeRequest) {
    const employee = await this.repo.findOne({ where: { id }, relations: { user: true, role: true } });
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
      const role = await this.roleRepo.findOneBy({ id: req.role_id });
      if (!role) throw new NotFoundException('Role not found');
      employee.role_id = req.role_id;
      employee.permissions = role.permissions;
      employee.role = role;
    } else if (req.permissions) {
      employee.permissions = req.permissions;
    }

    await this.userRepo.save(employee.user);
    await this.repo.save(employee);
    return this.repo.findOne({ where: { id: employee.id }, relations: { user: true, role: true } });
  }

  async toggleStatus(id: string, is_active: boolean) {
    const employee = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!employee) throw new NotFoundException('Employee not found');
    employee.is_active = is_active;
    employee.user.status = is_active ? 'active' : 'deactivated';
    await this.userRepo.save(employee.user);
    await this.repo.save(employee);
    return true;
  }

  async delete(id: string) {
    const employee = await this.repo.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');
    await this.repo.softRemove(employee);
    await this.userRepo.softRemove({ id: employee.user_id } as User);
    return true;
  }
}
