import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { SystemVariable } from 'src/infrastructure/entities/system-variables/system-variable.entity';
import { SystemVariableEnum } from 'src/infrastructure/data/enums/sysytem-variable.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';

@Injectable()
export class AdminHomeService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(SystemVariable) private readonly systemVariableRepo: Repository<SystemVariable>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async getStats() {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      active_subscriptions,
      total_stores,
      total_students,
      join_requests,
      total_revenue,
      active_offers,
      pending_requests_over_48h,
      expiring_subscriptions_this_week,
    ] = await Promise.all([
      this.subscriptionRepo.count({ where: { expire_at: MoreThan(now) } }),
      this.storeRepo.count({ where: { is_main_branch: true } }),
      this.userRepo.count({ where: { roles: Role.CLIENT } as any }),
      this.userRepo.count({ where: { roles: Role.STORE, status: 'pending' } as any }),
      this.systemVariableRepo.findOne({ where: { key: SystemVariableEnum.TOTAL_EARNINGS } }),
      this.offerRepo.count({ where: { is_active: true } }),
      // Pending store users waiting more than 48h
      this.userRepo
        .createQueryBuilder('u')
        .where("u.roles = :role", { role: Role.STORE })
        .andWhere("u.status = 'pending'")
        .andWhere('u.created_at <= :limit', { limit: fortyEightHoursAgo })
        .andWhere('u.deleted_at IS NULL')
        .getCount(),
      // Subscriptions expiring within the next 7 days
      this.subscriptionRepo
        .createQueryBuilder('s')
        .where('s.expire_at > :now', { now })
        .andWhere('s.expire_at <= :week', { week: weekFromNow })
        .andWhere('s.deleted_at IS NULL')
        .getCount(),
    ]);

    return {
      active_subscriptions,
      total_stores,
      total_students,
      join_requests,
      total_revenue: Number(total_revenue?.value ?? 0),
      active_offers,
      pending_requests_over_48h,
      expiring_subscriptions_this_week,
    };
  }

  async getRevenueChart(period: '7d' | '30d' | '12m') {
    const now = new Date();
    let from: Date;
    let groupBy: string;
    let labelFormat: (d: Date) => string;

    if (period === '12m') {
      from = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
      groupBy = `DATE_FORMAT(t.created_at, '%Y-%m')`;
      labelFormat = (d) => d.toISOString().substring(0, 7);
    } else {
      const days = period === '7d' ? 7 : 30;
      from = new Date(now);
      from.setDate(from.getDate() - days + 1);
      from.setHours(0, 0, 0, 0);
      groupBy = `DATE(t.created_at)`;
      labelFormat = (d) => d.toISOString().substring(0, 10);
    }

    const rows: { period: string; total: string }[] = await this.transactionRepo
      .createQueryBuilder('t')
      .select(groupBy, 'period')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.created_at >= :from', { from })
      .andWhere('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
      .andWhere('t.deleted_at IS NULL')
      .groupBy(groupBy)
      .orderBy(groupBy, 'ASC')
      .getRawMany();

    // Build complete date range with zeros for missing periods
    const result: { label: string; total: number }[] = [];
    const rowMap = new Map(rows.map((r) => [r.period, Number(r.total)]));

    if (period === '12m') {
      for (let i = 0; i < 12; i++) {
        const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
        const key = labelFormat(d);
        result.push({ label: key, total: rowMap.get(key) ?? 0 });
      }
    } else {
      const days = period === '7d' ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        const key = labelFormat(d);
        result.push({ label: key, total: rowMap.get(key) ?? 0 });
      }
    }

    return result;
  }

  async getTopStores(limit = 10) {
    const now = new Date();

    const stores = await this.storeRepo.find({
      where: { is_main_branch: true },
      relations: { subcategory: true },
      take: limit,
      order: { created_at: 'DESC' },
    });

    const result = await Promise.all(
      stores.map(async (store) => {
        const [active_offers, subscription] = await Promise.all([
          this.offerRepo
            .createQueryBuilder('o')
            .innerJoin('o.stores', 's')
            .where('s.id = :id', { id: store.id })
            .andWhere('o.is_active = true')
            .getCount(),
          this.subscriptionRepo.findOne({
            where: { user_id: store.user_id, expire_at: MoreThan(now) },
            relations: { package: true },
            order: { created_at: 'DESC' },
          }),
        ]);

        return {
          id: store.id,
          name: store.name,
          logo: store.logo,
          status: store.status,
          is_active: store.is_active,
          active_offers,
          subscription_package: subscription?.package?.name_en ?? null,
          subscription_expires_at: subscription?.expire_at ?? null,
        };
      }),
    );

    return result;
  }
}
