import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Promotion, PromotionType } from 'src/infrastructure/entities/promotion/promotion.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';

@Injectable()
export class AdminStoreService {
  constructor(
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Promotion) private readonly promotionRepo: Repository<Promotion>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
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

  async getStoreWallet(user_id: string) {
    const wallet = await this.walletRepo.findOneBy({ user_id });
    const recentTransactions = await this.transactionRepo.find({
      where: { user_id },
      order: { created_at: 'DESC' },
      take: 5,
    });
    return { wallet, recent_transactions: recentTransactions };
  }

  async getStoreTransactions(user_id: string, page = 1, limit = 10) {
    const [data, total] = await this.transactionRepo.findAndCount({
      where: { user_id },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getStoreOffers(user_id: string, page = 1, limit = 10) {
    const stores = await this.storeRepo.find({ where: { user_id }, select: ['id'] });
    const storeIds = stores.map((s) => s.id);

    if (!storeIds.length) return { data: [], total: 0 };

    const [data, total] = await this.offerRepo
      .createQueryBuilder('o')
      .innerJoin('o.stores', 's')
      .where('s.id IN (:...storeIds)', { storeIds })
      .leftJoinAndSelect('o.images', 'images')
      .orderBy('o.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
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
