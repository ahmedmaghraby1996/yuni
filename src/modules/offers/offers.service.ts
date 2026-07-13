import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { Repository, Brackets, MoreThan } from 'typeorm';
import { CreateOfferRequest } from './dto/requests/create-offer.request';
import { CreateOfferTransaction } from './util/create-offer.transaction';
import { UpdateOfferTransaction } from './util/update-offer.transaction';
import { UpdateOfferRequest } from './dto/requests/update-offer.request';
import { OfferView } from 'src/infrastructure/entities/offer/offer-view.entity';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { FavoriteOffer } from 'src/infrastructure/entities/offer/favorite-offer.entity';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
import { OfferUsage } from 'src/infrastructure/entities/offer/offer-usage.entity';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { Package } from 'src/infrastructure/entities/package/package.entity';

@Injectable()
export class OffersService extends BaseService<Offer> {
  constructor(
    @InjectRepository(Offer) private readonly repo: Repository<Offer>,
    @InjectRepository(OfferView)
    private readonly offerViewRepo: Repository<OfferView>,
    @Inject(REQUEST) private readonly request: Request,
    private readonly createOfferTransaction: CreateOfferTransaction,
    @InjectRepository(FavoriteOffer)
    private readonly favoriteOfferRepo: Repository<FavoriteOffer>,
    @InjectRepository(OfferUsage)
    private readonly offerUsageRepo: Repository<OfferUsage>,
    private readonly updateOfferTransaction: UpdateOfferTransaction,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
  ) {
    super(repo);
  }

  private get storeOwnerId(): string {
    return (this.request.user as any).owner_user_id ?? this.request.user.id;
  }

  async createOffer(req: CreateOfferRequest) {
    const offer = await this.createOfferTransaction.run(req);
    return offer;
  }
  async updateOffer(req: UpdateOfferRequest) {
    const offer = await this.updateOfferTransaction.run(req);
    return offer;
  }

  async makeSepcial(offer_id: string) {
    // make all offers not special
    await this.repo.update(
      { user_id: this.storeOwnerId },
      { is_special: false },
    );
    await this.repo.update(offer_id, { is_special: true });
    return true;
  }

  async viewIncrement(offer_id: string) {
    const is_viewed = await this.offerViewRepo.findOne({
      where: {
        offer_id: offer_id,
        user_id: this.request.user.id,
      },
    });
    if (!is_viewed) {
      await this.offerViewRepo.save({
        offer_id: offer_id,
        user_id: this.request.user.id,
      });
      await this.repo.increment({ id: offer_id }, 'views', 1);
    }
    return true;
  }

  async toggleOfferStatus(offer_id: string) {
    const usage = await this.offerUsageRepo.findOne({
      where: {
        offer_id: offer_id,
        user_id: this.request.user.id,
      },
    });

    if (usage) {
      if (usage.is_active) {
        usage.is_active = false;
        await this.offerUsageRepo.save(usage);
        // await this.repo.decrement({ id: offer_id }, 'uses', 1);
      } else {
        usage.is_active = true;
        await this.offerUsageRepo.save(usage);
        // await this.repo.increment({ id: offer_id }, 'uses', 1);
      }
      return usage.is_active;
    } else {
      const newUsage = await this.offerUsageRepo.save({
        offer_id: offer_id,
        user_id: this.request.user.id,
        is_active: true,
      });
      await this.repo.increment({ id: offer_id }, 'uses', 1);
      return newUsage.is_active;
    }
  }

  async getStoreOfferUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const userId = this.storeOwnerId;

    const baseQb = () =>
      this.offerUsageRepo
        .createQueryBuilder('usage')
        .innerJoin('usage.offer', 'offer')
        .innerJoin('offer.stores', 'store')
        .innerJoin('usage.user', 'user')
        .where('store.user_id = :userId', { userId })
        .andWhere('usage.is_active = true')
        .andWhere('usage.deleted_at IS NULL');

    const totalRaw = await baseQb()
      .select('COUNT(DISTINCT usage.user_id)', 'cnt')
      .getRawOne();
    const total = parseInt(totalRaw?.cnt ?? '0', 10);

    const results = await baseQb()
      .select([
        'usage.user_id AS userId',
        'user.name AS name',
        'user.phone AS phone',
        'user.avatar AS avatar',
        'COUNT(DISTINCT usage.id) AS activated_count', // mapped to codes_count in DTO
      ])
      .groupBy('usage.user_id')
      .addGroupBy('user.name')
      .addGroupBy('user.phone')
      .addGroupBy('user.avatar')
      .orderBy('activated_count', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    return { results, total };
  }

  async toggleOfferIsActive(offer_id: string) {
    const offer = await this.repo.findOne({ where: { id: offer_id } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    offer.is_active = !offer.is_active;
    await this.repo.save(offer);
    return offer.is_active;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎯 Method 1: Find Nearby Offers
  // ═══════════════════════════════════════════════════════════════

  async findNearbyOffers(
    latitude: string,
    longitude: string,
    order_by: 'most_used' | 'added_recently' = 'added_recently',
    page: number = 1,
    limit: number = 10,
    name?: string,
  ) {
    const radiusMeters = 10000;
    // حساب المسافة بدقة + حماية من NaN و NULL
    const distanceFormula = `
    ROUND(
      COALESCE(
        6371000 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(:lat)) *
            cos(radians(stores.latitude)) *
            cos(radians(stores.longitude) - radians(:lng)) +
            sin(radians(:lat)) *
            sin(radians(stores.latitude))
          ))
        ),
        0
      ),
      2
    )
  `;

    const queryBuilder = this._repo
      .createQueryBuilder('offer')

      .leftJoinAndSelect('offer.images', 'images')
      .leftJoinAndSelect('offer.subcategory', 'subcategory')
      .leftJoinAndSelect('offer.stores', 'stores') // Fix: Join stores so we can access stores.latitude
      .leftJoinAndSelect('stores.subcategory', 'store_subcategory')
      .addSelect(distanceFormula, 'distance')
      .where('offer.is_active = true')
      .andWhere('stores.is_active = true')
      .andWhere('stores.status = :approvedStatus', {
        approvedStatus: StoreStatus.APPROVED,
      })
      .andWhere('stores.latitude IS NOT NULL')
      .andWhere('stores.longitude IS NOT NULL')
      .andWhere(`${distanceFormula} <= :radius`)
      .setParameters({
        lat: Number(latitude),
        lng: Number(longitude),
        radius: radiusMeters,
      });

    if (name) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('offer.title_ar LIKE :name', { name: `%${name}%` })
            .orWhere('offer.title_en LIKE :name', { name: `%${name}%` })
            .orWhere('stores.name LIKE :name', { name: `%${name}%` });
        }),
      );
    }

    queryBuilder.orderBy('distance', 'ASC');

    if (order_by === 'most_used') {
      queryBuilder.orderBy('offer.uses', 'DESC');
    } else {
      queryBuilder.orderBy('offer.created_at', 'DESC');
    }

    const total = await queryBuilder.getCount();
    const rawResults = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    // توزيع المسافة على الـ offer وعلى كل store
    const offers = rawResults.entities.map((offer, index) => {
      const rawRow = rawResults.raw[index];
      const distanceValue = rawRow?.distance ?? 0;
      const distance =
        typeof distanceValue === 'number'
          ? distanceValue
          : parseFloat(distanceValue) || 0;

      (offer as any).distance = distance;

      if (offer.stores?.length) {
        offer.stores = offer.stores.map((store) => {
          (store as any).distance = distance;
          return store;
        });
      }

      return offer;
    });

    return { offers, total };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎯 Method 2: Find Best Offers (Trending / Popular)
  // ═══════════════════════════════════════════════════════════════

  async findBestOffers(
    latitude: string,
    longitude: string,
    radiusMeters = 10000,
  ) {
    const distanceFormula = `
    ROUND(
      COALESCE(
        6371000 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(:lat)) *
            cos(radians(stores.latitude)) *
            cos(radians(stores.longitude) - radians(:lng)) +
            sin(radians(:lat)) *
            sin(radians(stores.latitude))
          ))
        ),
        0
      ),
      2
    )
  `;

    // Step 1: احصل على IDs مع أدنى مسافة لكل offer
    const subQuery = this._repo
      .createQueryBuilder('offer')
      .select('offer.id', 'offer_id')
      .addSelect('offer.views', 'offer_views')
      .addSelect(`MIN(${distanceFormula})`, 'min_distance')
      .leftJoin('offer.stores', 'stores')
      .where('offer.is_active = true')
      .andWhere('stores.is_active = true')
      .andWhere('stores.status = :approvedStatus')
      .andWhere('stores.latitude IS NOT NULL')
      .andWhere('stores.longitude IS NOT NULL')
      .andWhere(`${distanceFormula} <= :radius`)
      .groupBy('offer.id')
      .addGroupBy('offer.views')
      .orderBy('offer.views', 'DESC')
      .addOrderBy('min_distance', 'ASC');

    const results = await subQuery
      .setParameters({
        lat: Number(latitude),
        lng: Number(longitude),
        radius: radiusMeters,
        approvedStatus: StoreStatus.APPROVED,
      })
      .getRawMany();

    if (results.length === 0) return [];

    // Step 2: جلب التفاصيل الكاملة
    const offerIds = results.map((r) => r.offer_id);

    const offers = await this._repo
      .createQueryBuilder('offer')

      .leftJoinAndSelect('offer.images', 'images')

      .leftJoinAndSelect('offer.subcategory', 'subcategory')
      .leftJoinAndSelect('offer.favorites', 'favorites')
      .whereInIds(offerIds)
      .getMany();

    // Step 3: توزيع المسافة على offer و stores
    const distanceMap = new Map(
      results.map((r) => [r.offer_id, parseFloat(r.min_distance) || 0]),
    );

    const offersWithDistance = offers.map((offer) => {
      const dist = distanceMap.get(offer.id) || 0;
      (offer as any).distance = dist;

      if (offer.stores?.length) {
        offer.stores = offer.stores.map((store) => {
          (store as any).distance = dist;
          return store;
        });
      }

      return offer;
    });

    // Step 4: sort حسب views DESC + distance ASC
    const orderMap = new Map(results.map((r, i) => [r.offer_id, i]));

    offersWithDistance.sort(
      (a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!,
    );

    return offersWithDistance;
  }

  async addRemoveFavorite(offer_id: string) {
    const favorite = await this.favoriteOfferRepo.findOne({
      where: {
        offer_id: offer_id,
        user_id: this.request.user.id,
      },
    });
    if (favorite) {
      await this.favoriteOfferRepo.remove(favorite);
      return false;
    } else {
      await this.favoriteOfferRepo.save({
        offer_id: offer_id,
        user_id: this.request.user.id,
      });
      return true;
    }
  }

  async getMyOffers(params: {
    userId: string;
    page: number;
    limit: number;
    is_active?: string;
    name?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const { userId, page, limit, is_active, name, start_date, end_date } = params;

    const qb = this.repo
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.stores', 'store')
      .leftJoinAndSelect('offer.subcategory', 'subcategory')
      .leftJoinAndSelect('offer.images', 'images')
      .where('offer.user_id = :userId', { userId })
      .andWhere('offer.deleted_at IS NULL');

    if (is_active !== undefined && is_active !== '') {
      qb.andWhere('offer.is_active = :is_active', { is_active: is_active === '1' || is_active === 'true' });
    }

    if (name && name.trim()) {
      qb.andWhere('(offer.title_ar LIKE :name OR offer.title_en LIKE :name)', {
        name: `%${name.trim()}%`,
      });
    }

    if (start_date) {
      qb.andWhere('(offer.start_date >= :start_date OR offer.start_date IS NULL)', { start_date });
    }

    if (end_date) {
      qb.andWhere('(offer.end_date <= :end_date OR offer.end_date IS NULL)', { end_date });
    }

    const total = await qb.getCount();
    const offers = await qb
      .orderBy('offer.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { offers, total };
  }

  async findOne(id: string) {
    const offer = await this.repo.findOne({
      where: { id: id },
      relations: {
        user: true,
        subcategory: true,
        images: true,
        favorites: true,
        stores: true,
      },
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  async getStoreOfferById(id: string, userId: string) {
    const offer = await this.findOne(id);
    if (offer.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to view this offer');
    }
    return offer;
  }

  async getOfferByCode(code: string) {
    const offer = await this.repo.findOne({
      where: { code },
      relations: {
        subcategory: true,
        images: true,
        stores: true,
      },
    });

    if (!offer) throw new NotFoundException('Invalid code');
    if (!offer.is_active) throw new BadRequestException('Offer is not active');
    if (offer.end_date && new Date(offer.end_date) < new Date()) {
      throw new BadRequestException('Offer has expired');
    }

    return offer;
  }

  async getStoreDashboard() {
    const userId = this.storeOwnerId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);

    const usageQb = (start?: Date, end?: Date) => {
      const qb = this.offerUsageRepo
        .createQueryBuilder('usage')
        .innerJoin('usage.offer', 'offer')
        .innerJoin('offer.stores', 'store')
        .where('store.user_id = :userId', { userId })
        .andWhere('usage.is_active = true')
        .andWhere('usage.deleted_at IS NULL');
      if (start) qb.andWhere('usage.created_at >= :start', { start });
      if (end) qb.andWhere('usage.created_at < :end', { end });
      return qb;
    };

    const [
      todayRaw, yesterdayRaw, monthRaw, lastMonthRaw,
      totalCustomersRaw, branchCount, activeOffersCount,
      subscription, wallet,
      monthlyUsageRaw, monthlyViewsRaw, dailyUsageRaw,
    ] = await Promise.all([
      usageQb(todayStart, now).select('COUNT(usage.id)', 'cnt').getRawOne(),
      usageQb(yesterdayStart, todayStart).select('COUNT(usage.id)', 'cnt').getRawOne(),
      usageQb(monthStart, now).select('COUNT(usage.id)', 'cnt').getRawOne(),
      usageQb(lastMonthStart, lastMonthEnd).select('COUNT(usage.id)', 'cnt').getRawOne(),
      usageQb().select('COUNT(DISTINCT usage.user_id)', 'cnt').getRawOne(),
      this.storeRepo.count({ where: { user_id: userId } }),
      this.repo.count({ where: { user_id: userId, is_active: true } }),
      this.subscriptionRepo.findOne({ where: { user_id: userId, expire_at: MoreThan(now) } }),
      this.walletRepo.findOneBy({ user_id: userId }),
      usageQb(yearStart, now)
        .select(['MONTH(usage.created_at) AS month', 'COUNT(usage.id) AS cnt'])
        .groupBy('MONTH(usage.created_at)').getRawMany(),
      this.offerViewRepo.createQueryBuilder('view')
        .innerJoin('view.offer', 'offer').innerJoin('offer.stores', 'store')
        .where('store.user_id = :userId', { userId })
        .andWhere('view.deleted_at IS NULL').andWhere('view.created_at >= :yearStart', { yearStart })
        .select(['MONTH(view.created_at) AS month', 'COUNT(view.id) AS cnt'])
        .groupBy('MONTH(view.created_at)').getRawMany(),
      usageQb(thirtyDaysAgo, now)
        .select(['DATE(usage.created_at) AS date', 'COUNT(usage.id) AS cnt'])
        .groupBy('DATE(usage.created_at)').orderBy('date', 'ASC').getRawMany(),
    ]);

    const pct = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : parseFloat(((cur - prev) / prev * 100).toFixed(1));

    const todayUsage = parseInt(todayRaw?.cnt ?? '0', 10);
    const monthUsage = parseInt(monthRaw?.cnt ?? '0', 10);

    // Subscription days remaining + remaining codes
    let days_remaining: number | null = null;
    let renew_soon = false;
    let remaining_codes: number | null = null;

    if (subscription) {
      days_remaining = Math.ceil((new Date(subscription.expire_at).getTime() - now.getTime()) / 86400000);
      renew_soon = days_remaining <= 7;
      const pkg = await this.packageRepo.findOneBy({ id: subscription.package_id });
      if (pkg?.codes_count != null) {
        const usedRaw = await usageQb(new Date(subscription.created_at), now)
          .select('COUNT(usage.id)', 'cnt').getRawOne();
        remaining_codes = Math.max(0, pkg.codes_count - parseInt(usedRaw?.cnt ?? '0', 10));
      }
    }

    // Monthly performance chart (12 months)
    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly_performance = monthLabels.map((label, i) => {
      const m = i + 1;
      const u = monthlyUsageRaw.find((r: any) => parseInt(r.month) === m);
      const v = monthlyViewsRaw.find((r: any) => parseInt(r.month) === m);
      return { month: label, usage_count: u ? parseInt(u.cnt, 10) : 0, views: v ? parseInt(v.cnt, 10) : 0 };
    });

    // Daily usage last 30 days
    const dailyMap = new Map(dailyUsageRaw.map((r: any) => [r.date, parseInt(r.cnt, 10)]));
    const daily_usage = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(todayStart.getTime() - (29 - i) * 86400000);
      const date = d.toISOString().split('T')[0];
      return { date, count: dailyMap.get(date) ?? 0 };
    });

    return {
      cards: {
        active_offers: { value: activeOffersCount },
        total_customers: { value: parseInt(totalCustomersRaw?.cnt ?? '0', 10) },
        total_branches: { value: branchCount },
        today_code_usage: {
          value: todayUsage,
          change_pct: pct(todayUsage, parseInt(yesterdayRaw?.cnt ?? '0', 10)),
        },
        monthly_usage: {
          value: monthUsage,
          change_pct: pct(monthUsage, parseInt(lastMonthRaw?.cnt ?? '0', 10)),
        },
        remaining_codes: { value: remaining_codes },
        subscription_days_remaining: { value: days_remaining, renew_soon },
        wallet_balance: { value: parseFloat(wallet?.balance?.toString() ?? '0') },
      },
      monthly_performance,
      daily_usage,
    };
  }

  async getTopOffersPerformance(limit = 10) {
    const userId = this.storeOwnerId;

    const [topOffersRaw, branchPerfRaw] = await Promise.all([
      // Start from Offer so offers with 0 usage still appear
      this.repo.createQueryBuilder('offer')
        .innerJoin('offer.stores', 'store')
        .leftJoin(OfferUsage, 'usage', 'usage.offer_id = offer.id AND usage.is_active = true AND usage.deleted_at IS NULL')
        .where('store.user_id = :userId', { userId })
        .andWhere('offer.deleted_at IS NULL')
        .select([
          'offer.id AS offer_id',
          'offer.title_ar AS title_ar',
          'offer.title_en AS title_en',
          'offer.is_active AS is_active',
          'store.name AS branch_name',
          'store.id AS branch_id',
          'COUNT(usage.id) AS usage_count',
        ])
        .groupBy('offer.id').addGroupBy('offer.title_ar').addGroupBy('offer.title_en')
        .addGroupBy('offer.is_active').addGroupBy('store.name').addGroupBy('store.id')
        .orderBy('usage_count', 'DESC').limit(limit).getRawMany(),

      // Branch performance: start from Store, left join usages via offers
      this.storeRepo.createQueryBuilder('store')
        .leftJoin('store.offers', 'offer')
        .leftJoin(OfferUsage, 'usage', 'usage.offer_id = offer.id AND usage.is_active = true AND usage.deleted_at IS NULL')
        .where('store.user_id = :userId', { userId })
        .andWhere('store.deleted_at IS NULL')
        .select(['store.id AS branch_id', 'store.name AS branch_name', 'COUNT(usage.id) AS usage_count'])
        .groupBy('store.id').addGroupBy('store.name')
        .orderBy('usage_count', 'DESC').getRawMany(),
    ]);

    const top_offers = topOffersRaw.map((r: any) => ({
      offer_id: r.offer_id,
      title_ar: r.title_ar,
      title_en: r.title_en,
      branch_name: r.branch_name,
      branch_id: r.branch_id,
      usage_count: parseInt(r.usage_count, 10),
      is_active: Boolean(Number(r.is_active)),
    }));

    const branchTotal = branchPerfRaw.reduce((s: number, r: any) => s + parseInt(r.usage_count, 10), 0);
    const branch_performance = branchPerfRaw.map((r: any) => ({
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      usage_count: parseInt(r.usage_count, 10),
      percentage: branchTotal > 0
        ? parseFloat(((parseInt(r.usage_count, 10) / branchTotal) * 100).toFixed(1))
        : 0,
    }));

    return { top_offers, branch_performance };
  }

  async getStoreReports(period?: string, branch_id?: string, date_from?: string, date_to?: string) {
    const userId = this.storeOwnerId;
    const { startDate, endDate } = this.buildDateRange(period, date_from, date_to);

    const buildUsageQb = () => {
      const qb = this.offerUsageRepo
        .createQueryBuilder('usage')
        .innerJoin('usage.offer', 'offer')
        .innerJoin('offer.stores', 'store')
        .where('store.user_id = :userId', { userId })
        .andWhere('usage.is_active = true')
        .andWhere('usage.deleted_at IS NULL');
      if (branch_id) qb.andWhere('store.id = :branch_id', { branch_id });
      if (startDate) qb.andWhere('usage.created_at >= :startDate', { startDate });
      if (endDate) qb.andWhere('usage.created_at <= :endDate', { endDate });
      return qb;
    };

    const buildViewQb = () => {
      const qb = this.offerViewRepo
        .createQueryBuilder('view')
        .innerJoin('view.offer', 'offer')
        .innerJoin('offer.stores', 'store')
        .where('store.user_id = :userId', { userId })
        .andWhere('view.deleted_at IS NULL');
      if (branch_id) qb.andWhere('store.id = :branch_id', { branch_id });
      if (startDate) qb.andWhere('view.created_at >= :startDate', { startDate });
      if (endDate) qb.andWhere('view.created_at <= :endDate', { endDate });
      return qb;
    };

    const [
      totalUsageRaw,
      bestOfferRaw,
      worstOfferRaw,
      totalViewsRaw,
      dailyUsageRaw,
      peakHoursRaw,
      monthlyRevenueRaw,
      branchPerformanceRaw,
      subscriptionTotalRaw,
      walletTotalRaw,
    ] = await Promise.all([
      // ── Summary ──────────────────────────────────────────────────
      buildUsageQb().select('COUNT(usage.id)', 'cnt').getRawOne(),

      buildUsageQb()
        .select(['offer.id AS offer_id', 'offer.title_ar AS title_ar', 'offer.title_en AS title_en', 'COUNT(usage.id) AS usage_count'])
        .groupBy('offer.id').addGroupBy('offer.title_ar').addGroupBy('offer.title_en')
        .orderBy('usage_count', 'DESC').limit(1).getRawOne(),

      buildUsageQb()
        .select(['offer.id AS offer_id', 'offer.title_ar AS title_ar', 'offer.title_en AS title_en', 'COUNT(usage.id) AS usage_count'])
        .groupBy('offer.id').addGroupBy('offer.title_ar').addGroupBy('offer.title_en')
        .orderBy('usage_count', 'ASC').limit(1).getRawOne(),

      buildViewQb().select('COUNT(view.id)', 'cnt').getRawOne(),

      // ── Daily usage trend (by day of week) ───────────────────────
      buildUsageQb()
        .select(['DAYOFWEEK(usage.created_at) AS day_of_week', 'COUNT(usage.id) AS count'])
        .groupBy('DAYOFWEEK(usage.created_at)')
        .orderBy('day_of_week', 'ASC')
        .getRawMany(),

      // ── Peak hours ────────────────────────────────────────────────
      buildUsageQb()
        .select(['HOUR(usage.created_at) AS hour', 'COUNT(usage.id) AS count'])
        .groupBy('HOUR(usage.created_at)')
        .orderBy('count', 'DESC')
        .limit(3)
        .getRawMany(),

      // ── Monthly revenue trend (last 6 months) ────────────────────
      buildUsageQb()
        .select(['MONTH(usage.created_at) AS month', 'YEAR(usage.created_at) AS year', 'SUM(offer.original_price) AS revenue'])
        .groupBy('YEAR(usage.created_at)').addGroupBy('MONTH(usage.created_at)')
        .orderBy('year', 'ASC').addOrderBy('month', 'ASC')
        .limit(6)
        .getRawMany(),

      // ── Branch performance ────────────────────────────────────────
      buildUsageQb()
        .select(['store.id AS branch_id', 'store.name AS branch_name', 'COUNT(usage.id) AS usage_count'])
        .groupBy('store.id').addGroupBy('store.name')
        .orderBy('usage_count', 'DESC')
        .getRawMany(),

      // ── Subscription payments ─────────────────────────────────────
      this.subscriptionRepo
        .createQueryBuilder('sub')
        .select('SUM(sub.price)', 'total')
        .where('sub.user_id = :userId', { userId })
        .getRawOne(),

      // ── Wallet transactions ───────────────────────────────────────
      this.transactionRepo
        .createQueryBuilder('tx')
        .select('SUM(tx.amount)', 'total')
        .where('tx.user_id = :userId', { userId })
        .getRawOne(),
    ]);

    // ── Process summary ───────────────────────────────────────────
    const total_coupons_used = parseInt(totalUsageRaw?.cnt ?? '0', 10);
    const total_customer_reach = parseInt(totalViewsRaw?.cnt ?? '0', 10);
    const conversion_rate = total_customer_reach > 0
      ? parseFloat(((total_coupons_used / total_customer_reach) * 100).toFixed(1))
      : 0;

    const toOfferSummary = (raw: any) => raw
      ? { id: raw.offer_id, title_ar: raw.title_ar, title_en: raw.title_en, usage_count: parseInt(raw.usage_count, 10) }
      : null;

    // ── Daily usage trend ─────────────────────────────────────────
    // MySQL DAYOFWEEK: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
    const dayNames = { 1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat' };
    const daily_usage_trend = Object.entries(dayNames).map(([dow, name]) => {
      const row = dailyUsageRaw.find((r: any) => String(r.day_of_week) === dow);
      return { day: name, count: row ? parseInt(row.count, 10) : 0 };
    });

    // ── Peak hours ────────────────────────────────────────────────
    const formatHour = (h: number) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour}${period}`;
    };
    const peakHoursSorted = peakHoursRaw.map((r: any) => parseInt(r.hour, 10)).sort((a, b) => a - b);
    const peak_hours = peakHoursSorted.length >= 2
      ? `${formatHour(peakHoursSorted[0])} - ${formatHour(peakHoursSorted[peakHoursSorted.length - 1])}`
      : peakHoursSorted.length === 1 ? formatHour(peakHoursSorted[0]) : null;

    // ── Monthly revenue trend ─────────────────────────────────────
    const revenue_trend = monthlyRevenueRaw.map((r: any, i: number) => ({
      label: i + 1,
      month: parseInt(r.month, 10),
      year: parseInt(r.year, 10),
      revenue: parseFloat(r.revenue ?? '0'),
    }));

    // ── Branch performance ────────────────────────────────────────
    const branchTotal = branchPerformanceRaw.reduce((sum: number, r: any) => sum + parseInt(r.usage_count, 10), 0);
    const branch_performance = branchPerformanceRaw.map((r: any) => ({
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      usage_count: parseInt(r.usage_count, 10),
      percentage: branchTotal > 0 ? parseFloat(((parseInt(r.usage_count, 10) / branchTotal) * 100).toFixed(1)) : 0,
    }));

    // ── Financial summary ─────────────────────────────────────────
    const subscription_payments = parseFloat(subscriptionTotalRaw?.total ?? '0');
    const wallet_transactions = parseFloat(walletTotalRaw?.total ?? '0');

    const revenueRaw = await buildUsageQb().select('SUM(offer.original_price)', 'total').getRawOne();
    const financial = {
      total_revenue: parseFloat(revenueRaw?.total ?? '0'),
      subscription_payments,
      wallet_transactions,
      refund_summary: 0,
    };

    return {
      // Summary cards
      total_code_usage: total_coupons_used,
      total_coupons_used,
      total_customer_reach,
      conversion_rate,
      best_offer: toOfferSummary(bestOfferRaw),
      worst_offer: toOfferSummary(worstOfferRaw),
      // Charts
      daily_usage_trend,
      peak_hours,
      revenue_trend,
      // Branch comparison
      branch_performance,
      // Financial
      financial,
    };
  }

  private buildDateRange(period?: string, date_from?: string, date_to?: string): { startDate?: Date; endDate?: Date } {
    if (date_from || date_to) {
      return {
        startDate: date_from ? new Date(date_from) : undefined,
        endDate: date_to ? new Date(date_to) : undefined,
      };
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
      case 'today':
        return { startDate: today, endDate: now };
      case 'week': {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        return { startDate: start, endDate: now };
      }
      case 'month':
        return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now };
      case 'year':
        return { startDate: new Date(now.getFullYear(), 0, 1), endDate: now };
      default:
        return {};
    }
  }
}

export class FavoriteOfferService extends BaseService<FavoriteOffer> {
  constructor(
    @InjectRepository(FavoriteOffer)
    private readonly repo: Repository<FavoriteOffer>,
  ) {
    super(repo);
  }
}
