import { Inject, Injectable, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { Repository } from 'typeorm';
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
    private readonly updateOfferTransaction: UpdateOfferTransaction, // Reusing the same transaction for update
  ) {
    super(repo);
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
      { user_id: this.request.user.id },
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
    } else {
      await this.offerUsageRepo.save({
        offer_id: offer_id,
        user_id: this.request.user.id,
        is_active: true,
      });
      await this.repo.increment({ id: offer_id }, 'uses', 1);
    }
    return true;
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
  ) {
    const radiusMeters = 10000;
    // ... [distanceFormula code remains the same, but it's long so I will keep the change focused]
    // I need to be careful with replace_file_content context.
    // The previous tool call output shows lines ~103-154 for findNearbyOffers.

    // Let's replace the signature and the specific ordering block.
    // Re-reading file content to ensure context match.
    // Line 103 starts async findNearbyOffers.
    // Line 150 starts if (order_by === 'most_used').

    // I'll execute two replacements on the same file if needed or one large one if context allows.
    // The previous view_file of offers.service.ts showed the method starting at line 103.
    // I'll replace the method signature and the sort logic.

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
      })
      .orderBy('distance', 'ASC');

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
    } else {
      await this.favoriteOfferRepo.save({
        offer_id: offer_id,
        user_id: this.request.user.id,
      });
    }
    return true;
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
}

export class FavoriteOfferService extends BaseService<FavoriteOffer> {
  constructor(
    @InjectRepository(FavoriteOffer)
    private readonly repo: Repository<FavoriteOffer>,
  ) {
    super(repo);
  }
}
