import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Seeder } from 'nestjs-seeder';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';

@Injectable()
export class AdminUserSeeder implements Seeder {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<any> {
    const exists = await this.userRepository.findOne({
      where: { username: 'superadmin' },
    });
    if (exists) return;

    const appKey = this.configService.get<string>('app.key');
    const password = await bcrypt.hash('Admin@123456' + appKey, bcrypt.genSaltSync(10));

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

    return this.userRepository.save(admin);
  }

  async drop(): Promise<any> {
    return this.userRepository.delete({ username: 'superadmin' });
  }
}
