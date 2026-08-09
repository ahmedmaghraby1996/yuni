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
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
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

  async getAnalytics() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      total_subscribers,
      subscribers_this_month,
      subscribers_last_month,
      total_revenue,
      revenue_this_month,
      revenue_last_month,
    ] = await Promise.all([
      this.subscriptionRepo.count({ where: { expire_at: MoreThan(now) } }),
      this.subscriptionRepo.createQueryBuilder('s')
        .where('s.created_at >= :start', { start: startOfThisMonth })
        .andWhere('s.deleted_at IS NULL').getCount(),
      this.subscriptionRepo.createQueryBuilder('s')
        .where('s.created_at >= :start', { start: startOfLastMonth })
        .andWhere('s.created_at < :end', { end: startOfThisMonth })
        .andWhere('s.deleted_at IS NULL').getCount(),
      this.transactionRepo.createQueryBuilder('t')
        .select('SUM(ABS(t.amount))', 'total')
        .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
        .andWhere('t.deleted_at IS NULL')
        .getRawOne().then((r) => Number(r?.total ?? 0)),
      this.transactionRepo.createQueryBuilder('t')
        .select('SUM(ABS(t.amount))', 'total')
        .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
        .andWhere('t.created_at >= :start', { start: startOfThisMonth })
        .andWhere('t.deleted_at IS NULL')
        .getRawOne().then((r) => Number(r?.total ?? 0)),
      this.transactionRepo.createQueryBuilder('t')
        .select('SUM(ABS(t.amount))', 'total')
        .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
        .andWhere('t.created_at >= :start', { start: startOfLastMonth })
        .andWhere('t.created_at < :end', { end: startOfThisMonth })
        .andWhere('t.deleted_at IS NULL')
        .getRawOne().then((r) => Number(r?.total ?? 0)),
    ]);

    const subscription_growth_percent = subscribers_last_month === 0
      ? 100
      : Math.round(((subscribers_this_month - subscribers_last_month) / subscribers_last_month) * 1000) / 10;

    const revenue_growth_percent = revenue_last_month === 0
      ? 100
      : Math.round(((revenue_this_month - revenue_last_month) / revenue_last_month) * 1000) / 10;

    return {
      total_subscribers,
      subscribers_this_month,
      subscription_growth_percent,
      total_revenue,
      revenue_this_month,
      revenue_growth_percent,
    };
  }
}
