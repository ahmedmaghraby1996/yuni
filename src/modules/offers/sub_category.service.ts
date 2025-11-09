import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { Repository } from 'typeorm';
import { CreateOfferRequest } from './dto/requests/create-offer.request';
import { CreateOfferTransaction } from './util/create-offer.transaction';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';

@Injectable()
export class SubCategoryService extends BaseService<SubCategory> {
  constructor(
    @InjectRepository(SubCategory) private readonly repo: Repository<SubCategory>,
  ) {
    super(repo);
  }


}
