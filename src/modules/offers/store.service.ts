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
    const queryBuilder = this.repo
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.category', 'category')
      .leftJoinAndSelect('store.city', 'city')
      .leftJoinAndSelect('store.user', 'user')
      .addSelect(
        `
        (6371000 * acos(
          cos(radians(:lat)) *
          cos(radians(store.latitude)) *
          cos(radians(store.longitude) - radians(:lng)) +
          sin(radians(:lat)) *
          sin(radians(store.latitude))
        ))
      `,
        'distance',
      )
      .where(
        `
        store.is_active = true AND
        store.status = :approvedStatus AND
        store.latitude IS NOT NULL AND
        store.longitude IS NOT NULL AND
        (6371000 * acos(
          cos(radians(:lat)) *
          cos(radians(store.latitude)) *
          cos(radians(store.longitude) - radians(:lng)) +
          sin(radians(:lat)) *
          sin(radians(store.latitude))
        )) <= :radius
      `,
      )
      .setParameters({
        lat: latitude,
        lng: longitude,
        radius: radiusMeters,
        approvedStatus: StoreStatus.APPROVED,
      });

    // Filter by store type
    if (storeType) {
      queryBuilder.andWhere('store.store_type = :storeType', { storeType });
    }
    // Filter by name
    if (name) {
      queryBuilder.andWhere('store.name LIKE :name', { name: `%${name}%` });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    queryBuilder.orderBy('distance', 'ASC');

    const rawResults = await queryBuilder.getRawAndEntities();

    // Map distance from raw results to entities
    const stores = rawResults.entities.map((store, index) => {
      const rawResult = rawResults.raw[index];
      (store as any).distance = rawResult?.distance
        ? parseFloat(rawResult.distance)
        : null;
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
