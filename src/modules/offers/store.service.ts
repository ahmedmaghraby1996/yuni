import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';

@Injectable()
export class StoreService extends BaseService<Store> {
  constructor(
    @InjectRepository(Store)
    public readonly repo: Repository<Store>,
    @Inject(REQUEST) private readonly _request: Request,
  ) {
    super(repo);
  }

  getDetails(id: string) {
    return this.repo.findOne({
      where: { id: id },
      relations: { user: true, subcategory: true,  },
    });
  }

  //with active offers and images
  getDetailsWithOffers(id: string) {
    return this.repo
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
      .where('store.id = :id', { id })
      .getOne();
  }

async findNearbyStores(
  latitude: string,
  longitude: string,
  radiusMeters = 10000,
  storeType?: 'in_store' | 'online' | 'both',
  name?: string,
  page?: number,
  limit?: number,
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
    .leftJoinAndSelect('store.user', 'user')
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

  const total = await queryBuilder.getCount();

  if (page && limit) {
    queryBuilder.skip((page - 1) * limit).take(limit);
  }

  queryBuilder.orderBy('distance', 'ASC');

  const rawResults = await queryBuilder.getRawAndEntities();

  // Build a robust map from store id -> distance using raw rows
  const storeDistanceMap = new Map<any, number>();
  rawResults.raw.forEach(row => {
    // Try common key names for store id
    const storeId = row.store_id ?? row.storeId ?? row['store_id'] ?? row['storeId'] ?? row.id ?? row['id'];

    // Fallback: look for any key that ends with 'store_id' or contains 'stores_id'
    let resolvedStoreId = storeId;
    if (resolvedStoreId == null) {
      const possibleIdKey = Object.keys(row).find(k => /stores?_id$|storeId$|store_id$|\bstore\b.*\bId\b/i.test(k));
      if (possibleIdKey) resolvedStoreId = row[possibleIdKey];
    }

    const rawDistance = row.distance ?? row.store_distance ?? row['distance'] ?? row['store_distance'];
    const parsed = rawDistance != null ? parseFloat(rawDistance) : NaN;
    const distance = Number.isFinite(parsed) ? parsed : 0;

    if (resolvedStoreId != null) {
      const prev = storeDistanceMap.get(resolvedStoreId);
      if (prev == null || distance < prev) {
        storeDistanceMap.set(resolvedStoreId, distance);
      }
    }
  });

  const stores = rawResults.entities.map((store) => {
    const distance = storeDistanceMap.get(store.id) ?? 0;
    (store as any).distance = distance;
    return store;
  });

  return { stores, total };
}


  async findAllStores(
    storeType?: 'in_store' | 'online' | 'both',
    page?: number,
    limit?: number,
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

    // Filter by name
    if (this._request.query.name) {
      queryBuilder.andWhere('store.name LIKE :name', {
        name: `%${this._request.query.name}%`,
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

    return { stores, total };
  }
}
