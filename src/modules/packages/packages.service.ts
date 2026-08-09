import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { MoreThan, Repository } from 'typeorm';
import {
  CreatePackageRequest,
  UpdatePackageRequest,
} from './dto/request/create-package.request';
import { plainToInstance } from 'class-transformer';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async getPackages() {
    const packages = await this.packageRepo.find({ order: { order_by: 'ASC' } });
    const now = new Date();
    const result = await Promise.all(
      packages.map(async (pkg) => {
        const [total_subscribers, current_subscribers] = await Promise.all([
          this.subscriptionRepo.count({ where: { package_id: pkg.id } }),
          this.subscriptionRepo.count({ where: { package_id: pkg.id, expire_at: MoreThan(now) } }),
        ]);
        return { ...pkg, total_subscribers, current_subscribers };
      }),
    );
    return result;
  }

  async getPackageById(id: string) {
    const pkg = await this.packageRepo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('package not found');
    const now = new Date();
    const [total_subscribers, current_subscribers] = await Promise.all([
      this.subscriptionRepo.count({ where: { package_id: id } }),
      this.subscriptionRepo.count({ where: { package_id: id, expire_at: MoreThan(now) } }),
    ]);
    return { ...pkg, total_subscribers, current_subscribers };
  }

  async createPackage(data: CreatePackageRequest) {
    const get_package = plainToInstance(Package, data);
    return await this.packageRepo.save(get_package);
  }

  async   updatePackage(id: string,data: UpdatePackageRequest) {
    const get_package = await this.packageRepo.findOne({
      where: { id: id },
    });
    if (!get_package) throw new NotFoundException('package not found');
    return await this.packageRepo.update(get_package.id, data);
  }

  async deletePackage(id: string) {
    const item = await this.packageRepo.findOne({
      where: { id: id },
    });
    if (!item) throw new NotFoundException('package not found');
    return await this.packageRepo.softRemove(item);
  }
}
