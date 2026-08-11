import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { OfferUsage } from 'src/infrastructure/entities/offer/offer-usage.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';
import { FirebaseAdminService } from '../notification/firebase-admin-service';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
import { toUrl } from 'src/core/helpers/file.helper';

@Injectable()
export class AdminHomeService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(OfferUsage) private readonly offerUsageRepo: Repository<OfferUsage>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(NotificationEntity) private readonly notificationRepo: Repository<NotificationEntity>,
    private readonly fcmService: FirebaseAdminService,
  ) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const growth = (current: number, last: number) =>
      last === 0 ? 100 : Math.round(((current - last) / last) * 1000) / 10;

    const [
      active_subscriptions,
      active_subscriptions_last_month,
      total_stores,
      total_stores_last_month,
      total_students,
      total_students_last_month,
      join_requests,
      total_revenue,
      active_offers,
      active_offers_last_month,
      pending_requests_over_48h,
      expiring_subscriptions_this_week,
    ] = await Promise.all([
      this.subscriptionRepo.count({ where: { expire_at: MoreThan(now) } }),
      this.subscriptionRepo.createQueryBuilder('s')
        .where('s.expire_at > :start', { start: startOfLastMonth })
        .andWhere('s.created_at < :end', { end: startOfMonth })
        .andWhere('s.deleted_at IS NULL').getCount(),
      this.storeRepo.count({ where: { is_main_branch: true } }),
      this.storeRepo.createQueryBuilder('s')
        .where('s.is_main_branch = true')
        .andWhere('s.created_at < :end', { end: startOfMonth }).getCount(),
      this.userRepo.count({ where: { roles: Role.CLIENT } as any }),
      this.userRepo.createQueryBuilder('u')
        .where('u.roles LIKE :role', { role: `%${Role.CLIENT}%` })
        .andWhere('u.created_at < :end', { end: startOfMonth }).getCount(),
      this.userRepo.count({ where: { roles: Role.STORE, status: 'pending' } as any }),
      this.transactionRepo.createQueryBuilder('t').select('SUM(ABS(t.amount))', 'total')
        .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
        .andWhere('t.deleted_at IS NULL').getRawOne().then((r) => Number(r?.total ?? 0)),
      this.offerRepo.count({ where: { is_active: true } }),
      this.offerRepo.createQueryBuilder('o')
        .where('o.is_active = true')
        .andWhere('o.created_at < :end', { end: startOfMonth }).getCount(),
      this.userRepo.createQueryBuilder('u')
        .where("u.roles = :role", { role: Role.STORE })
        .andWhere("u.status = 'pending'")
        .andWhere('u.created_at <= :limit', { limit: fortyEightHoursAgo })
        .andWhere('u.deleted_at IS NULL').getCount(),
      this.subscriptionRepo.createQueryBuilder('s')
        .where('s.expire_at > :now', { now })
        .andWhere('s.expire_at <= :week', { week: weekFromNow })
        .andWhere('s.deleted_at IS NULL').getCount(),
    ]);

    return {
      active_subscriptions,
      active_subscriptions_growth: growth(active_subscriptions, active_subscriptions_last_month),
      total_stores,
      total_stores_growth: growth(total_stores, total_stores_last_month),
      total_students,
      total_students_growth: growth(total_students, total_students_last_month),
      join_requests,
      total_revenue,
      active_offers,
      active_offers_growth: growth(active_offers, active_offers_last_month),
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
      .addSelect('SUM(ABS(t.amount))', 'total')
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

  async getPendingRequests(page = 1, limit = 10) {
    const [data, total] = await this.userRepo
      .createQueryBuilder('u')
      .where('u.roles = :role', { role: Role.STORE })
      .andWhere("u.status = 'pending'")
      .andWhere('u.deleted_at IS NULL')
      .leftJoinAndSelect('u.stores', 'store', 'store.is_main_branch = true')
      .orderBy('u.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((u) => {
        const mainStore = u.stores?.[0] ?? null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          created_at: u.created_at,
          waiting_hours: Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60)),
          store: mainStore ? { id: mainStore.id, name: mainStore.name, logo: toUrl(mainStore.logo) } : null,
        };
      }),
      total,
    };
  }

  async sendExpiryReminders(adminUserId: string) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiring = await this.subscriptionRepo
      .createQueryBuilder('s')
      .where('s.expire_at > :now', { now })
      .andWhere('s.expire_at <= :week', { week: weekFromNow })
      .andWhere('s.deleted_at IS NULL')
      .getMany();

    const title_ar = 'تذكير بانتهاء الاشتراك';
    const title_en = 'Subscription Expiry Reminder';
    const text_ar = 'اشتراكك سينتهي قريباً، يرجى التجديد للاستمرار في الاستفادة من الخدمات.';
    const text_en = 'Your subscription is expiring soon. Please renew to continue enjoying our services.';

    const userIds: string[] = [];

    for (const sub of expiring) {
      if (!sub.user_id) continue;
      userIds.push(sub.user_id);

      await this.notificationRepo.save(
        this.notificationRepo.create({
          user_id: sub.user_id,
          type: NotificationTypes.USERS,
          title_ar,
          title_en,
          text_ar,
          text_en,
          is_read: false,
        }),
      );

      const user = await this.userRepo.findOne({ where: { id: sub.user_id }, select: ['id', 'fcm_token'] });
      if (user?.fcm_token) {
        await this.fcmService.sendNotification(user.fcm_token, title_ar, text_ar).catch(() => {});
      }
    }

    // Save admin summary record
    await this.notificationRepo.save(
      this.notificationRepo.create({
        user_id: adminUserId,
        type: NotificationTypes.ADMIN,
        title_ar,
        title_en,
        text_ar,
        text_en,
        is_read: false,
        user_ids: userIds.length ? userIds : null,
      }),
    );

    return { sent: userIds.length };
  }

  async getTopMerchants(limit = 10) {
    const rows: { user_id: string; total: string }[] = await this.transactionRepo
      .createQueryBuilder('t')
      .select('t.user_id', 'user_id')
      .addSelect('SUM(ABS(t.amount))', 'total')
      .where('t.type = :type', { type: TransactionTypes.STORE_PAYMENT })
      .andWhere('t.deleted_at IS NULL')
      .groupBy('t.user_id')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany();

    const userIds = rows.map((r) => r.user_id);
    if (!userIds.length) return [];

    const stores = await this.storeRepo.find({
      where: userIds.map((uid) => ({ user_id: uid, is_main_branch: true })),
      select: ['id', 'name', 'logo', 'user_id'],
    });

    const storeMap = new Map(stores.map((s) => [s.user_id, s]));

    return rows.map((r) => {
      const store = storeMap.get(r.user_id);
      return {
        user_id: r.user_id,
        store_name: store?.name ?? null,
        logo: toUrl(store?.logo ?? null),
        total: Number(r.total),
      };
    });
  }

  async getTopStores(limit = 10) {
    const now = new Date();

    // Rank stores by total offer usages
    const rows: { store_id: string; total_usages: string }[] = await this.offerUsageRepo
      .createQueryBuilder('u')
      .select('os.store_id', 'store_id')
      .addSelect('COUNT(u.id)', 'total_usages')
      .innerJoin('offer_stores_store', 'os', 'os.offer_id = u.offer_id')
      .where('u.deleted_at IS NULL')
      .groupBy('os.store_id')
      .orderBy('total_usages', 'DESC')
      .limit(limit)
      .getRawMany();

    if (!rows.length) return [];

    const storeIds = rows.map((r) => r.store_id);
    const stores = await this.storeRepo.find({
      where: storeIds.map((id) => ({ id, is_main_branch: true })),
      select: ['id', 'name', 'logo', 'status', 'is_active', 'user_id'],
    });
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    const subscriptions = await Promise.all(
      stores.map((s) => this.subscriptionRepo.findOne({
        where: { user_id: s.user_id, expire_at: MoreThan(now) },
        relations: { package: true },
        order: { created_at: 'DESC' },
      })),
    );
    const subMap = new Map(stores.map((s, i) => [s.id, subscriptions[i]]));

    return rows.map((r) => {
      const store = storeMap.get(r.store_id);
      const subscription = subMap.get(r.store_id);
      return {
        id: r.store_id,
        name: store?.name ?? null,
        logo: toUrl(store?.logo ?? null),
        status: store?.status ?? null,
        is_active: store?.is_active ?? null,
        total_usages: Number(r.total_usages),
        subscription_package: subscription?.package?.name_en ?? null,
        subscription_expires_at: subscription?.expire_at ?? null,
      };
    });
  }
}
