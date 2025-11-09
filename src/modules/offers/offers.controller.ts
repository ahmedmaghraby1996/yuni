import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FavoriteOfferService, OffersService } from './offers.service';
import { CreateOfferRequest } from './dto/requests/create-offer.request';

import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { plainToInstance } from 'class-transformer';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import {
  UpdateAdminOfferRequest,
  UpdateOfferRequest,
} from './dto/requests/update-offer.request';
import { query } from 'express';
import {
  applyQueryFilters,
  applyQueryIncludes,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { app } from 'firebase-admin';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { OfferResponse } from './dto/responses/offer-response';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { SubCategoryService } from './sub_category.service';
import { Not } from 'typeorm';
import { StoreService } from './store.service';
import { BranchResponse } from '../user/dto/branch.response';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
import { CategoryService } from '../category/category.service';
@ApiTags('Offers')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly categoryService: CategoryService,
    protected readonly subCategoryService: SubCategoryService,
    private readonly storeService: StoreService,
    private readonly favoriteOfferService: FavoriteOfferService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  @Get('/sub-categories')
  async getSubCategories(@Query() PaginatedRequest: PaginatedRequest) {
    applyQueryFilters(PaginatedRequest, `is_active=1`);
    applyQuerySort(PaginatedRequest, 'order_by=asc');
    const subcategories = await this.subCategoryService.findAll(
      PaginatedRequest,
    );
    const total = await this.subCategoryService.count(PaginatedRequest);
    const response = plainToInstance(SubCategory, subcategories, {
      excludeExtraneousValues: true,
    });

    const result = this._i18nResponse.entity(response);
    return new PaginatedResponse(result, {
      meta: { total, ...PaginatedRequest },
    });
  }
  @Get('/categories')
  async getCategories(@Query() PaginatedRequest: PaginatedRequest) {
    applyQueryFilters(PaginatedRequest, `is_active=1`);
    applyQuerySort(PaginatedRequest, 'order_by=asc');
    const categories = await this.categoryService.findAll(PaginatedRequest);
    const total = await this.categoryService.count(PaginatedRequest);
    const response = plainToInstance(Category, categories, {
      excludeExtraneousValues: true,
    });
    //
    const result = this._i18nResponse.entity(response);
    return new PaginatedResponse(result, {
      meta: { total, ...PaginatedRequest },
    });
  }

  @Get('store')
  async getStore(@Query() query: PaginatedRequest) {
    applyQueryFilters(query, `is_active=1`);
    const total = await this.storeService.count(query);
    const stores = await this.storeService.findAll(query);
    const result = plainToInstance(BranchResponse, stores, {
      excludeExtraneousValues: true,
    });
    const response = this._i18nResponse.entity(result);
    return new PaginatedResponse(response, { meta: { total, ...query } });
  }

  @Roles(Role.ADMIN)
  @Get('admin/store')
  async getAllStore(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQueryIncludes(query, 'category');
    const total = await this.storeService.count(query);
    const stores = await this.storeService.findAll(query);
    const result = plainToInstance(BranchResponse, stores, {
      excludeExtraneousValues: true,
    });
    const response = this._i18nResponse.entity(result);
    return new PaginatedResponse(response, { meta: { total, ...query } });
  }

  @Roles(Role.ADMIN)
  @Get('admin/store/:id')
  async geStoredetials(@Param('id') id: string) {
    const stores = await this.storeService.getDetails(id);
    const result = plainToInstance(BranchResponse, stores, {
      excludeExtraneousValues: true,
    });

    return new ActionResponse(result);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Post('create')
  async createOffer(@Body() req: CreateOfferRequest) {
    const offer = await this.offersService.createOffer(req);
    return offer;
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Put('update')
  async updateOffer(@Body() req: UpdateOfferRequest) {
    const offer = await this.offersService.updateOffer(req);
    return offer;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Put('update/:offer_id')
  async updateAdminOffer(
    @Param('offer_id') offer_id,
    @Body() req: UpdateAdminOfferRequest,
  ) {
    req.id = offer_id;
    const offer = await this.offersService.updateOffer(req);
    return offer;
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Post('view-increment/:id')
  async viewCount(@Param('id') offer_id: string) {
    const offer = await this.offersService.viewIncrement(offer_id);
    return offer;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Get('store-offers')
  async getStoreOffers(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'images');
    applyQueryIncludes(query, 'stores');
    applyQueryFilters(query, `user_id=${this.request.user.id}`);
    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);
    const result = plainToInstance(OfferResponse, offers, {
      excludeExtraneousValues: true,
    });

    return new PaginatedResponse(result, {
      meta: { total, ...query },
    });
  }
  //
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Get('/admin/all')
  async getAdminOffers(@Query() query: PaginatedRequest) {
    const storesId = this.extractStoreId(query.filters);

    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'subcategory.category');
    applyQueryIncludes(query, 'images');
    applyQuerySort(query, 'created_at=DESC');
    // applyQueryFilters(query, `stores.is_active=1`);
    applyQueryFilters(
      query,
      `stores.status=${StoreStatus.APPROVED},stores.is_active=1`,
    );
    if (storesId) {
      applyQueryFilters(
        query,
        `stores.status=${StoreStatus.APPROVED},stores.is_active=1,stores.id=${storesId}`,
      );
    }
    applyQueryIncludes(query, 'favorites');

    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);
    offers.map((offer) => {
      offer.is_favorite =
        offer.favorites?.some(
          (favorite) =>
            String(favorite.user_id) === String(this.request.user.id),
        ) ?? false;

      return offer;
    });
    const result = plainToInstance(OfferResponse, offers, {
      excludeExtraneousValues: true,
    });

    return new PaginatedResponse(result, {
      meta: { total, ...query },
    });
  }
  //store

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Get('all-offers')
  async getClientOffers(@Query() query: PaginatedRequest) {
    const storesId = this.extractStoreId(query.filters);

    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'subcategory.category');
    applyQueryIncludes(query, 'images');
    applyQuerySort(query, 'created_at=DESC');
    // applyQueryFilters(query, `stores.is_active=1`);
    applyQueryFilters(
      query,
      `stores.status=${StoreStatus.APPROVED},stores.is_active=1`,
    );
    if (storesId) {
      applyQueryFilters(
        query,
        `stores.status=${StoreStatus.APPROVED},stores.is_active=1,stores.id=${storesId}`,
      );
    }
    applyQueryIncludes(query, 'favorites');

    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);
    offers.map((offer) => {
      offer.is_favorite =
        offer.favorites?.some(
          (favorite) =>
            String(favorite.user_id) === String(this.request.user.id),
        ) ?? false;

      return offer;
    });
    const result = plainToInstance(OfferResponse, offers, {
      excludeExtraneousValues: true,
    });

    const response = this._i18nResponse.entity(result);
    return new PaginatedResponse(response, {
      meta: { total, ...query },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Get('nearby-offers')
  async getNearbyOffers(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: number,
  ) {
    const offers = await this.offersService.findNearbyOffers(lat, lng, radius);
    const result = plainToInstance(OfferResponse, offers, {
      excludeExtraneousValues: true,
    });
    const response = this._i18nResponse.entity(result);
    return new ActionResponse(response);
  }
  //DELETE OFFER
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @Delete('delete/:id')
  async deleteOffer(@Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return await this.offersService.softDelete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Post('make-special/:id')
  async makeSpecialOffer(@Param('id') id: string) {
    const offer = await this.offersService.makeSepcial(id);

    return offer;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Post('add-remove-favorite/:id')
  async addRemoveFavorite(@Param('id') id: string) {
    const offer = await this.offersService.addRemoveFavorite(id);
    return offer;
  }

  //get favorite offers
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Get('favorite-offers')
  async getClientFavoriteOffers(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'subcategory.category');
    applyQueryIncludes(query, 'images');
    // applyQueryFilters(query, `stores.is_active=1`);

    applyQueryFilters(
      query,
      `stores.status=${StoreStatus.APPROVED},stores.is_active=1`,
    );
    applyQueryIncludes(query, 'favorites');
    applyQueryFilters(query, `favorites.user_id=${this.request.user.id}`);

    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);

    const result = plainToInstance(OfferResponse, offers, {
      excludeExtraneousValues: true,
    });

    const response = this._i18nResponse.entity(result);
    return new PaginatedResponse(response, {
      meta: { total, ...query },
    });
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE, Role.CLIENT,)
  @Get('details/:id')
  async getOfferById(@Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    const result = plainToInstance(OfferResponse, offer, {
      excludeExtraneousValues: true,
    });
    result.is_favorite =
      offer.favorites?.some(
        (favorite) => String(favorite.user_id) === String(this.request.user.id),
      ) ?? false;
    const response = this._i18nResponse.entity(result);

    return new ActionResponse(response);
  }

    @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles( Role.ADMIN)
  @Get('admin/details/:id')
  async getAdminOfferById(@Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    const result = plainToInstance(OfferResponse, offer, {
      excludeExtraneousValues: true,
    });
   
 

    return new ActionResponse(result);
  }
  private extractStoreId(filters: string | string[]): string | null {
    if (!filters) return null;
    // normalize to array
    const filterArr = Array.isArray(filters) ? filters : [filters];

    const storeFilter = filterArr.find((f) => f.startsWith('stores.id='));
    if (!storeFilter) return null;

    // return everything after "stores.id="
    return storeFilter.substring('stores.id='.length) || null;
  }
}
