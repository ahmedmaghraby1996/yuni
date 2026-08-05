import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Promotion, PromotionType } from 'src/infrastructure/entities/promotion/promotion.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';

@Injectable()
export class AdminStoreService {
  constructor(
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Promotion) private readonly promotionRepo: Repository<Promotion>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async getStoresByUserId(user_id: string, page = 1, limit = 10) {
    const [stores, total] = await this.storeRepo.findAndCount({
      where: { user_id },
      relations: { subcategory: true, city: true },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (!stores.length && page === 1) {
      const user = await this.storeRepo.manager.query(
        `SELECT id FROM user WHERE id = ? LIMIT 1`,
        [user_id],
      );
      if (!user.length) throw new NotFoundException('User not found');
    }

    const now = new Date();
    const promotions = await this.promotionRepo.find({ where: { type: PromotionType.BRANCH } });
    const activeMap = new Map(
      promotions
        .filter((p) => new Date(p.end_date) >= now)
        .map((p) => [p.target_id, p]),
    );
    for (const store of stores) {
      (store as any).promotion = activeMap.get(store.id) ?? null;
    }

    return { stores, total };
  }

  async getSubscriptionsByUserId(user_id: string, page = 1, limit = 10) {
    const [subscriptions, total] = await this.subscriptionRepo.findAndCount({
      where: { user_id },
      relations: { package: true },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { subscriptions, total };
  }
}
