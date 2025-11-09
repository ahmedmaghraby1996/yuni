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
  return this._repo
    .createQueryBuilder('offer')
    .leftJoinAndSelect('offer.stores', 'stores')
    .leftJoinAndSelect('offer.images', 'images')
    .leftJoinAndSelect('offer.user', 'user')
    .leftJoinAndSelect('offer.subcategory', 'subcategory')
    .addSelect(
      `
      (6371000 * acos(
        cos(radians(:lat)) *
        cos(radians(stores.latitude)) *
        cos(radians(stores.longitude) - radians(:lng)) +
        sin(radians(:lat)) *
        sin(radians(stores.latitude))
      ))
    `,
      'distance',
    )
    .where(
      `
      stores.is_active = true AND
      stores.status = :approvedStatus AND
      (6371000 * acos(
        cos(radians(:lat)) *
        cos(radians(stores.latitude)) *
        cos(radians(stores.longitude) - radians(:lng)) +
        sin(radians(:lat)) *
        sin(radians(stores.latitude))
      )) <= :radius
    `,
    )
    .setParameters({
      lat: latitude,
      lng: longitude,
      radius: radiusMeters,
      approvedStatus: StoreStatus.APPROVED,
    })
    .orderBy('distance', 'ASC')
    .getMany();
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
      relations: { user: true, subcategory: { category: true }, images: true ,favorites: true, stores: true},
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