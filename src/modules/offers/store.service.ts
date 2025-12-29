import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';

import { StoreFollow } from 'src/infrastructure/entities/store/store-follow.entity';

@Injectable()
export class StoreService extends BaseService<Store> {
  constructor(
    @InjectRepository(Store)
    public readonly repo: Repository<Store>,
    @Inject(REQUEST) private readonly _request: Request,
    @InjectRepository(StoreFollow)
    private readonly storeFollowRepo: Repository<StoreFollow>,
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
      .leftJoinAndSelect('store.category', 'category')
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

    return { stores, total };
  }
}
