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
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';
import { FirebaseAdminService } from '../notification/firebase-admin-service';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';

@Injectable()
export class AdminHomeService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(SystemVariable) private readonly systemVariableRepo: Repository<SystemVariable>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(NotificationEntity) private readonly notificationRepo: Repository<NotificationEntity>,
    private readonly fcmService: FirebaseAdminService,
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
          store: mainStore ? { id: mainStore.id, name: mainStore.name, logo: mainStore.logo } : null,
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
        logo: store?.logo ?? null,
        total: Number(r.total),
      };
    });
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
