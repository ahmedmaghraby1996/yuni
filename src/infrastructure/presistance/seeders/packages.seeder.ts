import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seeder } from 'nestjs-seeder';
import { Package } from 'src/infrastructure/entities/package/package.entity';

@Injectable()
export class PackagesSeeder implements Seeder {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
  ) {}

  async seed(): Promise<any> {
    const count = await this.packageRepo.count();
    if (count > 0) return;

    const packages: Partial<Package>[] = [
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
        codes_count: 200,
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
        codes_count: 1000,
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
        codes_count: null,
        branches_count: null,
        features_ar: ['عروض غير محدودة', 'أكواد غير محدودة', 'فروع غير محدودة', 'دعم أولوية'],
        features_en: ['Unlimited offers', 'Unlimited codes', 'Unlimited branches', 'Priority support'],
      },
    ];

    return this.packageRepo.save(packages as Package[]);
  }

  async drop(): Promise<any> {
    return this.packageRepo.delete({});
  }
}
