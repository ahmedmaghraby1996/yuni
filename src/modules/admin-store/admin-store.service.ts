import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Promotion, PromotionType } from 'src/infrastructure/entities/promotion/promotion.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';

@Injectable()
export class AdminStoreService {
  constructor(
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Promotion) private readonly promotionRepo: Repository<Promotion>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
  ) {}

  async getStoresByUserId(user_id: string, page = 1, limit = 10, name?: string, is_active?: boolean) {
    const qb = this.storeRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.subcategory', 'subcategory')
      .leftJoinAndSelect('s.city', 'city')
      .where('s.user_id = :user_id', { user_id })
      .orderBy('s.created_at', 'DESC');

    if (name) qb.andWhere('s.name LIKE :name', { name: `%${name}%` });
    if (is_active !== undefined) qb.andWhere('s.is_active = :is_active', { is_active });

    const total = await qb.getCount();
    const stores = await qb.skip((page - 1) * limit).take(limit).getMany();

    if (!stores.length && page === 1) {
      const user = await this.storeRepo.manager.query(`SELECT id FROM user WHERE id = ? LIMIT 1`, [user_id]);
      if (!user.length) throw new NotFoundException('User not found');
    }

    const now = new Date();
    const promotions = await this.promotionRepo.find({ where: { type: PromotionType.BRANCH } });
    const activeMap = new Map(promotions.filter((p) => new Date(p.end_date) >= now).map((p) => [p.target_id, p]));
    for (const store of stores) (store as any).promotion = activeMap.get(store.id) ?? null;

    return { stores, total };
  }

  async getStoreOffers(user_id: string, page = 1, limit = 10, name?: string, is_active?: boolean) {
    const stores = await this.storeRepo.find({ where: { user_id }, select: ['id'] });
    const storeIds = stores.map((s) => s.id);

    if (!storeIds.length) return { data: [], total: 0 };

    const qb = this.offerRepo
      .createQueryBuilder('o')
      .innerJoin('o.stores', 's')
      .where('s.id IN (:...storeIds)', { storeIds })
      .leftJoinAndSelect('o.images', 'images')
      .orderBy('o.created_at', 'DESC');

    if (name) qb.andWhere('o.title_ar LIKE :name OR o.title_en LIKE :name', { name: `%${name}%` });
    if (is_active !== undefined) qb.andWhere('o.is_active = :is_active', { is_active });

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total };
  }

  async getSubscriptionsByUserId(user_id: string, page = 1, limit = 10, date_from?: string, date_to?: string) {
    const qb = this.subscriptionRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.package', 'package')
      .where('s.user_id = :user_id', { user_id })
      .orderBy('s.created_at', 'DESC');

    if (date_from) qb.andWhere('s.created_at >= :date_from', { date_from });
    if (date_to) qb.andWhere('s.created_at <= :date_to', { date_to });

    const total = await qb.getCount();
    const subscriptions = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { subscriptions, total };
  }
}
