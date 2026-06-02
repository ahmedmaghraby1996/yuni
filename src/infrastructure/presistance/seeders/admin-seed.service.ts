import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    const adminExists = await this.userRepository.findOne({
      where: { username: 'superadmin' },
    });

    if (adminExists) return;

    const password = await bcrypt.hash('Admin@123456', bcrypt.genSaltSync(10));

    const admin = this.userRepository.create({
      name: 'Super Admin',
      account: '00000000',
      username: 'superadmin',
      password,
      email: 'super@app.com',
      email_verified_at: new Date(),
      phone: '+966500000000',
      phone_verified_at: new Date(),
      roles: [Role.ADMIN, Role.SUPERADMIN],
    });

    await this.userRepository.save(admin);
    this.logger.log('Admin user seeded: superadmin / Admin@123456');
  }
}
