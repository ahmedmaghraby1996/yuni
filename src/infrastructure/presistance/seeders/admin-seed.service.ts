import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Package) private readonly packageRepository: Repository<Package>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedPackages();
  }

  private async seedAdmin() {
    const appKey = this.configService.get<string>('app.key');
    const password = await bcrypt.hash('Admin@123456' + appKey, bcrypt.genSaltSync(10));

    const adminExists = await this.userRepository.findOne({ where: { username: 'superadmin' } });

    if (adminExists) {
      const isCorrect = await bcrypt.compare('Admin@123456' + appKey, adminExists.password);
      if (!isCorrect) {
        await this.userRepository.update(adminExists.id, { password });
        this.logger.log('Admin password corrected');
      }
      return;
    }

    await this.userRepository.save(
      this.userRepository.create({
        name: 'Super Admin',
        account: '00000000',
        username: 'superadmin',
        password,
        email: 'super@app.com',
        email_verified_at: new Date(),
        phone: '+966500000000',
        phone_verified_at: new Date(),
        roles: [Role.ADMIN, Role.SUPERADMIN],
      }),
    );
    this.logger.log('Admin user seeded — username: superadmin, password: Admin@123456');
  }

  private async seedPackages() {
    const count = await this.packageRepository.count();
    if (count > 0) return;

    const packages = [
      {
        name_ar: 'الباقة الشاملة',
        name_en: 'Basic Package',
        description_ar: 'باقة مثالية للبدء',
        description_en: 'Perfect package to get started',
        price: 99,
        duration: 30,
        order_by: 1,
        is_active: true,
        color: '#C8B8FF',
        offers_count: 20,
        employees_count: 200,
        branches_count: 1,
        features_ar: ['20 عرض شهريا', '200 كود استخدام', 'فرع واحد'],
        features_en: ['20 monthly offers', '200 usage codes', '1 branch'],
      },
      {
        name_ar: 'الباقة المثالية',
        name_en: 'Standard Package',
        description_ar: 'للأعمال المتنامية',
        description_en: 'For growing businesses',
        price: 299,
        duration: 30,
        order_by: 2,
        is_active: true,
        color: '#B8E8FF',
        offers_count: 200,
        employees_count: 1000,
        branches_count: 5,
        features_ar: ['200 عرض شهريا', '1000 كود استخدام', 'حتى 5 فروع', 'تحليلات متقدمة'],
        features_en: ['200 monthly offers', '1000 usage codes', 'Up to 5 branches', 'Advanced analytics'],
      },
      {
        name_ar: 'الباقة القياسية',
        name_en: 'Premium Package',
        description_ar: 'الحل الكامل للأعمال الكبيرة',
        description_en: 'Full solution for large businesses',
        price: 599,
        duration: 30,
        order_by: 3,
        is_active: true,
        color: '#FFE8B8',
        offers_count: null,
        employees_count: null,
        branches_count: null,
        features_ar: ['عروض غير محدودة', 'أكواد غير محدودة', 'فروع غير محدودة', 'دعم أولوية'],
        features_en: ['Unlimited offers', 'Unlimited codes', 'Unlimited branches', 'Priority support'],
      },
    ];

    await this.packageRepository.save(packages as Package[]);
    this.logger.log('Packages seeded (3 packages)');
  }
}
