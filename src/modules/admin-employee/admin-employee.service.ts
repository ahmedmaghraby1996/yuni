import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as sharp from 'sharp';
import { AdminEmployee, AdminEmployeePermissions } from 'src/infrastructure/entities/admin/admin-employee.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { AdminCreateEmployeeRequest } from './dto/admin-create-employee.request';
import { AdminUpdateEmployeeRequest } from './dto/admin-update-employee.request';

@Injectable()
export class AdminEmployeeService {
  constructor(
    @InjectRepository(AdminEmployee) private readonly repo: Repository<AdminEmployee>,
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

  async getAll(page = 1, limit = 10, name?: string, is_active?: boolean) {
    const qb = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'user')
      .orderBy('e.created_at', 'DESC');

    if (name) qb.andWhere('user.name LIKE :name', { name: `%${name}%` });
    if (is_active !== undefined) qb.andWhere('e.is_active = :is_active', { is_active });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
  }

  async getById(id: string) {
    const employee = await this.repo.findOne({ where: { id }, relations: { user: true } });
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
      status: 'active',
      email_verified_at: new Date(),
      ...(avatar && { avatar }),
    });
    const savedUser = await this.userRepo.save(user);

    const employee = this.repo.create({
      user_id: savedUser.id,
      permissions: req.permissions ?? {},
      is_active: true,
    });
    const saved = await this.repo.save(employee);
    return this.repo.findOne({ where: { id: saved.id }, relations: { user: true } });
  }

  async update(id: string, req: AdminUpdateEmployeeRequest) {
    const employee = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!employee) throw new NotFoundException('Employee not found');

    if (req.name) employee.user.name = req.name;
    if (req.phone) employee.user.phone = req.phone;
    if (req.email) employee.user.email = req.email;
    if (req.password) employee.user.password = await bcrypt.hash(req.password + this.config.get('app.key'), 10);
    if (req.avatarFile) employee.user.avatar = await this.uploadAvatar(req.avatarFile);
    if (req.permissions) employee.permissions = req.permissions;

    await this.userRepo.save(employee.user);
    await this.repo.save(employee);
    return this.repo.findOne({ where: { id: employee.id }, relations: { user: true } });
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
