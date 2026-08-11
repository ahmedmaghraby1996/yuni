import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoreThan } from 'typeorm';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { OfferUsage } from 'src/infrastructure/entities/offer/offer-usage.entity';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { toUrl } from 'src/core/helpers/file.helper';

@Injectable()
export class AdminPackagesService {
  constructor(
    @InjectRepository(Package) private readonly packageRepo: Repository<Package>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(OfferUsage) private readonly offerUsageRepo: Repository<OfferUsage>,
  ) {}

  async getDashboard(page = 1, limit = 10) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      active_subscriptions,
      active_subscriptions_last_month,
      total_revenue,
      revenue_this_month,
      revenue_last_month,
      active_merchants,
      active_merchants_last_month,
      total_merchants,
      total_merchants_last_month,
      total_students,
      total_students_last_month,
      expiring_soon,
      pending_requests,
      upgrades_this_month,
    ] = await Promise.all([
      this.subscriptionRepo.count({ where: { expire_at: MoreThan(now) } }),
      this.subscriptionRepo.createQueryBuilder('s')
        .where('s.expire_at > :start', { start: startOfLastMonth })
        .andWhere('s.created_at < :end', { end: startOfMonth })
        .andWhere('s.deleted_at IS NULL').getCount(),
      this.transactionRepo.createQueryBuilder('t').select('SUM(ABS(t.amount))', 'total')
        .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT }).andWhere('t.deleted_at IS NULL')
        .getRawOne().then((r) => Number(r?.total ?? 0)),
      this.transactionRepo.createQueryBuilder('t').select('SUM(ABS(t.amount))', 'total')
        .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
        .andWhere('t.created_at >= :start', { start: startOfMonth }).andWhere('t.deleted_at IS NULL')
        .getRawOne().then((r) => Number(r?.total ?? 0)),
      this.transactionRepo.createQueryBuilder('t').select('SUM(ABS(t.amount))', 'total')
        .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
        .andWhere('t.created_at >= :start', { start: startOfLastMonth })
        .andWhere('t.created_at < :end', { end: startOfMonth }).andWhere('t.deleted_at IS NULL')
        .getRawOne().then((r) => Number(r?.total ?? 0)),
      this.storeRepo.createQueryBuilder('s')
        .innerJoin('subscription', 'sub', 'sub.user_id = s.user_id AND sub.expire_at > :now', { now })
        .where('s.is_main_branch = true').andWhere('s.is_active = true').getCount(),
      this.storeRepo.createQueryBuilder('s')
        .innerJoin('subscription', 'sub', 'sub.user_id = s.user_id AND sub.expire_at > :start AND sub.created_at < :end', { start: startOfLastMonth, end: startOfMonth })
        .where('s.is_main_branch = true').andWhere('s.is_active = true').getCount(),
      this.storeRepo.count({ where: { is_main_branch: true } }),
      this.storeRepo.createQueryBuilder('s')
        .where('s.is_main_branch = true').andWhere('s.created_at < :end', { end: startOfMonth }).getCount(),
      this.userRepo.count({ where: { roles: Role.CLIENT } as any }),
      this.userRepo.createQueryBuilder('u')
        .where('u.roles LIKE :role', { role: `%${Role.CLIENT}%` })
        .andWhere('u.created_at < :end', { end: startOfMonth }).getCount(),
      this.subscriptionRepo.createQueryBuilder('s').where('s.expire_at > :now', { now })
        .andWhere('s.expire_at <= :week', { week: weekFromNow }).andWhere('s.deleted_at IS NULL').getCount(),
      this.userRepo.count({ where: { roles: Role.STORE, status: 'pending' } as any }),
      this.subscriptionRepo.createQueryBuilder('s')
        .where('s.created_at >= :start', { start: startOfMonth }).andWhere('s.deleted_at IS NULL').getCount(),
    ]);

    const growth = (current: number, last: number) =>
      last === 0 ? 100 : Math.round(((current - last) / last) * 1000) / 10;

    const revenue_growth = growth(revenue_this_month, revenue_last_month);
    const active_subscriptions_growth = growth(active_subscriptions, active_subscriptions_last_month);
    const active_merchants_growth = growth(active_merchants, active_merchants_last_month);
    const total_merchants_growth = growth(total_merchants, total_merchants_last_month);
    const total_students_growth = growth(total_students, total_students_last_month);

    // Daily usage trend (last 4 weeks)
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const usageByDay: { day: string; count: string }[] = await this.offerUsageRepo
      .createQueryBuilder('u')
      .select('DAYNAME(u.created_at)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('u.created_at >= :from', { from: fourWeeksAgo })
      .groupBy('DAYOFWEEK(u.created_at)')
      .addGroupBy('DAYNAME(u.created_at)')
      .orderBy('DAYOFWEEK(u.created_at)', 'ASC')
      .getRawMany();

    // Revenue trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const revenueByMonth: { month: string; total: string }[] = await this.transactionRepo
      .createQueryBuilder('t')
      .select("DATE_FORMAT(t.created_at, '%Y-%m')", 'month')
      .addSelect('SUM(ABS(t.amount))', 'total')
      .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
      .andWhere('t.created_at >= :from', { from: sixMonthsAgo })
      .andWhere('t.deleted_at IS NULL')
      .groupBy("DATE_FORMAT(t.created_at, '%Y-%m')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Most popular package (by subscriber count)
    const popularRaw = await this.subscriptionRepo
      .createQueryBuilder('s').select('s.package_id', 'package_id').addSelect('COUNT(*)', 'count')
      .where('s.deleted_at IS NULL').groupBy('s.package_id').orderBy('count', 'DESC').limit(1).getRawOne();

    let popular_package = null;
    if (popularRaw?.package_id) {
      const pkg = await this.packageRepo.findOneBy({ id: popularRaw.package_id });
      const pkgActive = await this.subscriptionRepo.count({ where: { package_id: popularRaw.package_id, expire_at: MoreThan(now) } });
      popular_package = {
        name_ar: pkg?.name_ar, name_en: pkg?.name_en,
        percentage: active_subscriptions ? Math.round((pkgActive / active_subscriptions) * 100) : 0,
      };
    }

    // Top selling package (by revenue)
    const topSellingRaw = await this.transactionRepo
      .createQueryBuilder('t')
      .select('s.package_id', 'package_id')
      .addSelect('SUM(ABS(t.amount))', 'total')
      .innerJoin('subscription', 's', 's.user_id = t.user_id AND s.deleted_at IS NULL')
      .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
      .andWhere('t.deleted_at IS NULL')
      .andWhere('s.package_id IS NOT NULL')
      .groupBy('s.package_id')
      .orderBy('total', 'DESC')
      .limit(1)
      .getRawOne();

    let top_selling_package = null;
    if (topSellingRaw?.package_id) {
      const pkg = await this.packageRepo.findOneBy({ id: topSellingRaw.package_id });
      const pkgSubscribers = await this.subscriptionRepo.count({ where: { package_id: topSellingRaw.package_id } });
      top_selling_package = {
        name_ar: pkg?.name_ar, name_en: pkg?.name_en,
        percentage: total_merchants ? Math.round((pkgSubscribers / total_merchants) * 100) : 0,
        total_revenue: Math.round(Number(topSellingRaw.total)),
      };
    }

    // Avg subscription duration in months
    const avgDuration = await this.subscriptionRepo.manager
      .query(`SELECT AVG(TIMESTAMPDIFF(DAY, s.created_at, s.expire_at)) / 30.0 as avg FROM subscription s WHERE s.deleted_at IS NULL`)
      .then((r: any[]) => Math.round(Number(r?.[0]?.avg ?? 0) * 10) / 10);

    // Renewal rate
    const renewalData = await this.subscriptionRepo.manager
      .query(`SELECT COUNT(*) as cnt FROM (SELECT user_id FROM subscription WHERE deleted_at IS NULL GROUP BY user_id HAVING COUNT(*) > 1) t`);
    const renewal_rate = total_merchants === 0 ? 0
      : Math.round((Number(renewalData?.[0]?.cnt ?? 0) / total_merchants) * 100);

    // Recent subscriptions
    const [recent, recent_total] = await this.subscriptionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.package', 'package')
      .leftJoinAndSelect('s.user', 'user')
      .where('s.deleted_at IS NULL')
      .orderBy('s.created_at', 'DESC')
      .skip((page - 1) * limit).take(limit)
      .getManyAndCount();

    const recent_subscriptions = await Promise.all(recent.map(async (s) => {
      const store = await this.storeRepo.findOne({
        where: { user_id: s.user_id, is_main_branch: true }, select: ['id', 'name', 'logo'],
      });
      const offers_count = await this.storeRepo.manager
        .query(
          `SELECT COUNT(DISTINCT o.id) as cnt FROM offer_stores_store os
           INNER JOIN offer o ON o.id = os.offer_id AND o.deleted_at IS NULL
           INNER JOIN store st ON st.id = os.store_id AND st.user_id = ? AND st.deleted_at IS NULL`,
          [s.user_id],
        ).then((r: any[]) => Number(r?.[0]?.cnt ?? 0));
      return {
        id: s.id,
        user_id: s.user_id,
        name: (s.user as any)?.name ?? null,
        phone: (s.user as any)?.phone ?? null,
        store_name: store?.name ?? null,
        logo: toUrl(store?.logo ?? null),
        offers_count,
        package_name_ar: s.package?.name_ar ?? s.name_ar,
        package_name_en: s.package?.name_en ?? s.name_en,
        is_active: s.is_active,
        expire_at: s.expire_at,
        created_at: s.created_at,
      };
    }));

    return {
      stats: {
        active_subscriptions, active_subscriptions_growth,
        total_revenue,
        revenue_this_month, revenue_growth,
        active_merchants, active_merchants_growth,
        total_merchants, total_merchants_growth,
        total_students, total_students_growth,
      },
      alerts: { expiring_soon, pending_requests },
      subscription_details: { popular_package, top_selling_package, upgrades_this_month, avg_duration_months: avgDuration, renewal_rate },
      usage_trend: usageByDay.map((r) => ({ day: r.day, count: Number(r.count) })),
      revenue_trend: revenueByMonth.map((r) => ({ month: r.month, total: Number(r.total) })),
      recent_subscriptions: { data: recent_subscriptions, total: recent_total, page, limit },
    };
  }
}
