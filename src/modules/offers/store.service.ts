import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Repository, In } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';

import { StoreFollow } from 'src/infrastructure/entities/store/store-follow.entity';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';

@Injectable()
export class StoreService extends BaseService<Store> {
  constructor(
    @InjectRepository(Store)
    public readonly repo: Repository<Store>,
    @Inject(REQUEST) private readonly _request: Request,
    @InjectRepository(StoreFollow)
    private readonly storeFollowRepo: Repository<StoreFollow>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {
    super(repo);
  }

  getDetails(id: string) {
    return this.repo.findOne({
      where: { id: id },
      relations: { user: true, subcategory: true },
    });
  }

  //with active offers and images
  async getDetailsWithOffers(id: string) {
    const store = await this.repo
      .createQueryBuilder('store')
      .leftJoinAndSelect(
        'store.offers',
        'offer',
        'offer.is_active = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('offer.images', 'images')
      .leftJoinAndSelect('store.subcategory', 'subcategory')
      .leftJoinAndSelect('store.city', 'city')
      .leftJoinAndSelect('store.user', 'user')
      .leftJoinAndSelect('store.followers', 'followers')
      .where('store.id = :id', { id })
      .getOne();

    if (store) {
      store.is_followed = store.followers?.some(
        (f) => f.user_id === this._request.user?.id,
      );
    }
    return store;
  }

  async toggleFollowStore(store_id: string) {
    const follow = await this.storeFollowRepo.findOne({
      where: {
        store_id: store_id,
        user_id: this._request.user.id,
      },
    });
    if (follow) {
      await this.storeFollowRepo.remove(follow);
      return false; // unfollowed
    } else {
      await this.storeFollowRepo.save({
        store_id: store_id,
        user_id: this._request.user.id,
      });
      return true; // followed
    }
  }

  async getStoreFollowers(store_id: string, query: PaginatedRequest) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [followers, total] = await this.storeFollowRepo.findAndCount({
      where: { store_id: store_id },
      relations: ['user', 'user.city'],
      skip: skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { users: followers.map((f) => f.user), total };
  }

  async getFollowingStores(
    query: PaginatedRequest,
    lat?: string,
    lng?: string,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.storeFollowRepo.findAndCount({
      where: { user_id: this._request.user.id },
      relations: ['store', 'store.city', 'store.subcategory'],
      skip: skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const stores = follows
      .filter((f) => f.store)
      .map((f) => {
        // Manually populating is_followed since we are fetching from follows table
        f.store.is_followed = true;

        if (lat && lng && f.store.latitude && f.store.longitude) {
          f.store.distance = this.calculateDistance(
            Number(lat),
            Number(lng),
            Number(f.store.latitude),
            Number(f.store.longitude),
          );
        }

        return f.store;
      });

    return { stores, total };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Radius of the earth in m
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in m
    return parseFloat(d.toFixed(2));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async findNearbyStores(
    latitude: string,
    longitude: string,
    radiusMeters = 10000,
    storeType?: 'in_store' | 'online' | 'both',
    name?: string,
    page?: number,
    limit?: number,
    sub_category_id?: string,
    recommend?: boolean,
  ) {
    // ✅ ROUND ensures we always get a numeric value (even 0)
    const distanceFormula = `
    ROUND(
      COALESCE(
        6371000 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(:lat)) *
            cos(radians(store.latitude)) *
            cos(radians(store.longitude) - radians(:lng)) +
            sin(radians(:lat)) *
            sin(radians(store.latitude))
          ))
        ),
        0
      ),
      2
    )
  `;

    const queryBuilder = this.repo
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.subcategory', 'subcategory')
      .leftJoinAndSelect('store.city', 'city')
      .addSelect(distanceFormula, 'distance') // ✅ Always returns a number
      .where('store.is_active = true')
      .andWhere('store.status = :approvedStatus', {
        approvedStatus: StoreStatus.APPROVED,
      })
      .andWhere('store.latitude IS NOT NULL')
      .andWhere('store.longitude IS NOT NULL')
      .andWhere(`${distanceFormula} <= :radius`)
      .setParameters({
        lat: Number(latitude),
        lng: Number(longitude),
        radius: radiusMeters,
      });

    if (storeType) {
      queryBuilder.andWhere('store.store_type = :storeType', { storeType });
    }

    if (name) {
      queryBuilder.andWhere('store.name LIKE :name', { name: `%${name}%` });
    }

    if (sub_category_id) {
      queryBuilder.andWhere('store.subcategory_id = :sub_category_id', {
        sub_category_id,
      });
    }

    const total = await queryBuilder.getCount();

    if (page && limit) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }

    if (recommend) {
      queryBuilder.orderBy('store.views', 'DESC');
    } else {
      queryBuilder.orderBy('distance', 'ASC');
    }

    const rawResults = await queryBuilder.getRawAndEntities();

    // ✅ Enhanced mapping with better error handling
    const stores = rawResults.entities.map((store, index) => {
      const rawRow = rawResults.raw[index];
      const distanceValue = rawRow?.distance ?? rawRow?.store_distance ?? 0;

      (store as any).distance =
        typeof distanceValue === 'number'
          ? distanceValue
          : parseFloat(distanceValue) || 0;

      return store;
    });

    await this.enrichWithHighestDiscountOffer(stores as unknown as Store[]);
    await this.enrichWithIsFollowed(stores as unknown as Store[]);

    return { stores, total };
  }

  async findAllStores(
    storeType?: 'in_store' | 'online' | 'both',
    page?: number,
    limit?: number,
    sub_category_id?: string,
  ) {
    const queryBuilder = this.repo
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.subcategory', 'subcategory')
      .leftJoinAndSelect('store.city', 'city')
      .leftJoinAndSelect('store.user', 'user')
      .where('store.is_active = true AND store.status = :approvedStatus', {
        approvedStatus: StoreStatus.APPROVED,
      });

    // Filter by store type
    if (storeType) {
      queryBuilder.andWhere('store.store_type = :storeType', { storeType });
    }

    if (sub_category_id) {
      queryBuilder.andWhere('store.subcategory_id = :sub_category_id', {
        sub_category_id,
      });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    const stores = await queryBuilder.getMany();

    await this.enrichWithHighestDiscountOffer(stores);
    await this.enrichWithIsFollowed(stores);

    return { stores, total };
  }

  private async enrichWithHighestDiscountOffer(stores: Store[]) {
    if (!stores.length) return;

    const storeIds = stores.map((s) => s.id);

    // Fetch active offers for these stores with just enough info to determine the best one
    // We get all active offers linked to these stores
    const allOffersRaw = await this.offerRepo
      .createQueryBuilder('offer')
      .innerJoin('offer.stores', 'store')
      .select(['offer.id', 'offer.offer_percentage', 'store.id'])
      .where('store.id IN (:...storeIds)', { storeIds })
      .andWhere('offer.is_active = true')
      .getRawMany(); // returns { offer_id, offer_offer_percentage, store_id }

    // Find best offer ID for each store
    const bestOfferMap = new Map<string, string>(); // store_id -> offer_id

    for (const raw of allOffersRaw) {
      const storeId = raw.store_id;
      const offerId = raw.offer_id;
      const percentage = parseFloat(raw.offer_offer_percentage) || 0;

      if (!bestOfferMap.has(storeId)) {
        bestOfferMap.set(storeId, offerId);
      } else {
        const currentBestId = bestOfferMap.get(storeId);
        const currentBest = allOffersRaw.find(
          (r) => r.offer_id === currentBestId,
        );
        const currentPercentage =
          parseFloat(currentBest?.offer_offer_percentage) || 0;

        if (percentage > currentPercentage) {
          bestOfferMap.set(storeId, offerId);
        }
      }
    }

    const bestOfferIds = Array.from(new Set(bestOfferMap.values()));

    if (bestOfferIds.length > 0) {
      // Fetch full offer details for the winners
      const bestOffers = await this.offerRepo.find({
        where: { id: In(bestOfferIds) },
        relations: ['images'],
      });

      // Map back to stores
      for (const store of stores) {
        const bestOfferId = bestOfferMap.get(store.id);
        if (bestOfferId) {
          (store as any).highest_discount_offer = bestOffers.find(
            (o) => o.id === bestOfferId,
          );
        }
      }
    }
  }

  private async enrichWithIsFollowed(stores: Store[]) {
    if (!this._request.user?.id || !stores.length) return;

    const storeIds = stores.map((s) => s.id);

    const follows = await this.storeFollowRepo.find({
      where: {
        user_id: this._request.user.id,
        store_id: In(storeIds),
      },
      select: ['store_id'],
    });

    const followedStoreIds = new Set(follows.map((f) => f.store_id));

    for (const store of stores) {
      (store as any).is_followed = followedStoreIds.has(store.id);
    }
  }
}
