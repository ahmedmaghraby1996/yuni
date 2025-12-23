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

async findNearbyOffers(
  latitude: string,
  longitude: string,
  radiusMeters = 500,
) {
  // ✅ Fixed: Added ROUND + COALESCE + LEAST/GREATEST
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
    .leftJoinAndSelect('offer.stores', 'stores')
    .leftJoinAndSelect('offer.images', 'images')
    .leftJoinAndSelect('offer.user', 'user')
    .leftJoinAndSelect('offer.subcategory', 'subcategory')
    .addSelect(distanceFormula, 'distance')
    .where('offer.is_active = true')
    .andWhere('stores.is_active = true')
    .andWhere('stores.status = :approvedStatus')
    .andWhere('stores.latitude IS NOT NULL')
    .andWhere('stores.longitude IS NOT NULL')
    .andWhere(`${distanceFormula} <= :radius`)
    .setParameters({
      lat: Number(latitude),
      lng: Number(longitude),
      radius: radiusMeters,
      approvedStatus: StoreStatus.APPROVED,
    })
    .orderBy('distance', 'ASC');

  const rawResults = await queryBuilder.getRawAndEntities();

  // Build a robust map from offer id -> nearest distance using raw rows
  const offerDistanceMap = new Map<any, number>();
  rawResults.raw.forEach(row => {
    const offerId = row.offer_id ?? row.offerId ?? row['offer_id'];
    const rawDistance = row.distance ?? row.min_distance ?? row['distance'];
    const parsed = rawDistance != null ? parseFloat(rawDistance) : NaN;
    const distance = Number.isFinite(parsed) ? parsed : 0;
    if (offerId != null) {
      const prev = offerDistanceMap.get(offerId);
      if (prev == null || distance < prev) {
        offerDistanceMap.set(offerId, distance);
      }
    }
  });

  const offers = rawResults.entities.map((offer) => {
    const distance = offerDistanceMap.get(offer.id) ?? 0;
    (offer as any).distance = distance;
    return offer;
  });

  return offers;
}


async findBestOffers(
  latitude: string,
  longitude: string,
  radiusMeters = 10000,
) {
  // ✅ Fixed: Added ROUND to force numeric output
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
    .leftJoinAndSelect('offer.stores', 'stores')
    .leftJoinAndSelect('offer.images', 'images')
    .leftJoinAndSelect('offer.user', 'user')
    .leftJoinAndSelect('offer.subcategory', 'subcategory')
    .leftJoinAndSelect('offer.favorites', 'favorites')
    // ✅ Select the MINIMUM distance among all stores for this offer
    .addSelect(`MIN(${distanceFormula})`, 'min_distance')
    .where('offer.is_active = true')
    .andWhere('stores.is_active = true')
    .andWhere('stores.status = :approvedStatus')
    .andWhere('stores.latitude IS NOT NULL')
    .andWhere('stores.longitude IS NOT NULL')
    .andWhere(`${distanceFormula} <= :radius`)
    .setParameters({
      lat: Number(latitude),
      lng: Number(longitude),
      radius: radiusMeters,
      approvedStatus: StoreStatus.APPROVED,
    })
    // ✅ Group by offer to avoid duplicates
    .groupBy('offer.id')
    .addGroupBy('images.id')
    .addGroupBy('user.id')
    .addGroupBy('subcategory.id')
    .addGroupBy('favorites.id')
    .orderBy('offer.views', 'DESC')
    .addOrderBy('min_distance', 'ASC');

  const rawResults = await queryBuilder.getRawAndEntities();
    
  // Build a robust map from offer id -> nearest distance using raw rows
  const offerDistanceMap = new Map<any, number>();
  rawResults.raw.forEach(row => {
    const offerId = row.offer_id ?? row.offerId ?? row['offer_id'];
    const rawDistance = row.min_distance ?? row.distance ?? row['min_distance'];
    const parsed = rawDistance != null ? parseFloat(rawDistance) : NaN;
    const distance = Number.isFinite(parsed) ? parsed : 0;
    if (offerId != null) {
      const prev = offerDistanceMap.get(offerId);
      if (prev == null || distance < prev) {
        offerDistanceMap.set(offerId, distance);
      }
    }
  });

  const offers = rawResults.entities.map((offer) => {
    const distance = offerDistanceMap.get(offer.id) ?? 0;
    (offer as any).distance = distance;
    return offer;
  });

  return offers;
}

// ═══════════════════════════════════════════════════════════════
// 🎯 Alternative Solution: If you need ALL stores with distances
// ═══════════════════════════════════════════════════════════════

async findBestOffersWithAllStores(
  latitude: string,
  longitude: string,
  radiusMeters = 10000,
) {
  const distanceFormula = `
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
    )
  `;

  const rawResults = await this._repo
    .createQueryBuilder('offer')
    .leftJoinAndSelect('offer.stores', 'stores')
    .leftJoinAndSelect('offer.images', 'images')
    .leftJoinAndSelect('offer.user', 'user')
    .leftJoinAndSelect('offer.subcategory', 'subcategory')
    .leftJoinAndSelect('offer.favorites', 'favorites')
    .addSelect(distanceFormula, 'distance')
    .where('offer.is_active = true')
    .andWhere('stores.is_active = true')
    .andWhere('stores.status = :approvedStatus')
    .andWhere('stores.latitude IS NOT NULL')
    .andWhere('stores.longitude IS NOT NULL')
    .andWhere(`${distanceFormula} <= :radius`)
    .setParameters({
      lat: Number(latitude),
      lng: Number(longitude),
      radius: radiusMeters,
      approvedStatus: StoreStatus.APPROVED,
    })
    .orderBy('offer.views', 'DESC')
    .addOrderBy('distance', 'ASC')
    .getRawAndEntities();

  // ✅ Group offers manually and attach stores with distances
  // Build a map: offerId -> (storeId -> distance)
  const offerStoreDistanceMap = new Map<any, Map<any, number>>();
  rawResults.raw.forEach(row => {
    const offerId = row.offer_id ?? row.offerId ?? row['offer_id'];
    const storeId = row.stores_id ?? row.storesId ?? row['stores_id'] ?? row['storesId'];
    const rawDistance = row.distance ?? row.min_distance ?? row['distance'];
    const parsed = rawDistance != null ? parseFloat(rawDistance) : NaN;
    const distance = Number.isFinite(parsed) ? parsed : 0;
    if (offerId != null && storeId != null) {
      let m = offerStoreDistanceMap.get(offerId);
      if (!m) {
        m = new Map();
        offerStoreDistanceMap.set(offerId, m);
      }
      // Keep the smallest distance per store if multiple rows exist
      const prev = m.get(storeId);
      if (prev == null || distance < prev) {
        m.set(storeId, distance);
      }
    }
  });

  const offersMap = new Map<string | number, any>();

  rawResults.entities.forEach((offer) => {
    const offerId = offer.id;
    if (!offersMap.has(offerId)) {
      const storeDistances = offerStoreDistanceMap.get(offerId) ?? new Map();
      const stores = (offer.stores || []).map(store => ({
        ...store,
        distance: storeDistances.get(store.id) ?? 0,
      }));
      const nearest = stores.length
        ? stores.reduce((min, s) => Math.min(min, s.distance ?? 0), Infinity)
        : 0;
      const nearestDistance = Number.isFinite(nearest) ? nearest : 0;

      offersMap.set(offerId, {
        ...offer,
        stores,
        nearestDistance,
        distance: nearestDistance, // top-level distance alias
      });
    }
  });

  // Convert map to array and sort by views DESC, then nearest distance ASC
  const offers = Array.from(offersMap.values()).sort((a, b) => {
    if (b.views !== a.views) {
      return b.views - a.views; // Sort by views DESC
    }
    return a.nearestDistance - b.nearestDistance; // Then by distance ASC
  });

  return offers;
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
      relations: { user: true, subcategory: true, images: true, favorites: true, stores: true },
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