import {
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
import { ApiOperation } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { plainToInstance } from 'class-transformer';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { JwtOptionalAuthGuard } from '../authentication/guards/jwt-optional-auth.guard';
import { StoreService } from './store.service';
import { BranchResponse } from '../user/dto/branch.response';
import { GetStoreRequest } from './dto/requests/get-store.request';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { UpdateAdminOfferRequest, UpdateOfferRequest, UpdateStoreOfferRequest } from './dto/requests/update-offer.request';
import { applyQueryFilters, applyQueryIncludes, applyQuerySort } from 'src/core/helpers/service-related.helper';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { OfferResponse } from './dto/responses/offer-response';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { SubCategoryService } from './sub_category.service';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
import { CategoryService } from '../category/category.service';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { CreateOfferRequest } from './dto/requests/create-offer.request';

@ApiTags('Offers')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly storeService: StoreService,
    private readonly categoryService: CategoryService,
    protected readonly subCategoryService: SubCategoryService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get('store')
  async getStore(@Query() query: GetStoreRequest) {
    const { lat, lng, store_type, name, page, limit, sub_category_id, recommend } = query;
    const pageNum = page || 1;
    const limitNum = limit || 10;
    if (lat && lng) {
      const { stores, total } = await this.storeService.findNearbyStores(lat, lng, 10000, store_type, name, pageNum, limitNum, sub_category_id, recommend);
      const result = plainToInstance(BranchResponse, stores, { excludeExtraneousValues: true });
      return new PaginatedResponse(this._i18nResponse.entity(result), { meta: { total, page: pageNum, limit: limitNum } });
    }
    const { stores, total } = await this.storeService.findAllStores(store_type, pageNum, limitNum, sub_category_id);
    const result = plainToInstance(BranchResponse, stores, { excludeExtraneousValues: true });
    return new PaginatedResponse(this._i18nResponse.entity(result), { meta: { total, page: pageNum, limit: limitNum } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get Stores Followed by User' })
  @Get('store/following')
  async getFollowingStores(@Query() query: PaginatedRequest, @Query('lat') lat?: string, @Query('lng') lng?: string) {
    const { stores, total } = await this.storeService.getFollowingStores(query, lat, lng);
    const result = plainToInstance(BranchResponse, stores, { excludeExtraneousValues: true });
    return new PaginatedResponse(this._i18nResponse.entity(result), { meta: { total, ...query } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Follow or Unfollow a Store' })
  @Post('store/follow/:id')
  async followStore(@Param('id') id: string) {
    return new ActionResponse(await this.storeService.toggleFollowStore(id));
  }

  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @Get('store/:id')
  async getStoreDetails(@Param('id') id: string) {
    const store = await this.storeService.getDetailsWithOffers(id);
    const result = plainToInstance(BranchResponse, store, { excludeExtraneousValues: true });
    return new ActionResponse(this._i18nResponse.entity(result));
  }

  @Get('sub-categories')
  async getSubCategories(@Query() query: PaginatedRequest) {
    applyQueryFilters(query, `is_active=1`);
    applyQuerySort(query, 'order_by=asc');
    const subcategories = await this.subCategoryService.findAll(query);
    const total = await this.subCategoryService.count(query);
    const result = this._i18nResponse.entity(plainToInstance(SubCategory, subcategories, { excludeExtraneousValues: true }));
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @Get('categories')
  async getCategories(@Query() query: PaginatedRequest) {
    applyQueryFilters(query, `is_active=1`);
    applyQuerySort(query, 'order_by=asc');
    const categories = await this.categoryService.findAll(query);
    const total = await this.categoryService.count(query);
    const result = this._i18nResponse.entity(plainToInstance(Category, categories, { excludeExtraneousValues: true }));
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  // ─── Client ────────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Get('all-offers')
  async getClientOffers(@Query() query: PaginatedRequest) {
    const storesId = this.extractStoreId(query.filters);
    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'images');
    applyQuerySort(query, 'created_at=DESC');
    applyQueryFilters(query, `stores.status=${StoreStatus.APPROVED},stores.is_active=1`);
    if (storesId) applyQueryFilters(query, `stores.status=${StoreStatus.APPROVED},stores.is_active=1,stores.id=${storesId}`);
    applyQueryIncludes(query, 'favorites');
    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);
    offers.forEach(o => { o.is_favorite = o.favorites?.some(f => String(f.user_id) === String(this.request.user.id)) ?? false; });
    const result = this._i18nResponse.entity(plainToInstance(OfferResponse, offers, { excludeExtraneousValues: true }));
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Get('best-offers')
  async getBestOffers(@Query('lat') lat: string, @Query('lng') lng: string) {
    const offers = await this.offersService.findBestOffers(lat, lng);
    offers.forEach(o => { o.is_favorite = o.favorites?.some(f => String(f.user_id) === String(this.request.user.id)) ?? false; });
    return new ActionResponse(this._i18nResponse.entity(plainToInstance(OfferResponse, offers, { excludeExtraneousValues: true })));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get Nearby Offers' })
  @Get('nearby-offers')
  @ApiQuery({ name: 'lat', required: true, type: String })
  @ApiQuery({ name: 'lng', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'order_by', required: false, enum: ['most_used', 'added_recently'] })
  async getNearbyOffers(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('name') name?: string,
    @Query('order_by') order_by: 'most_used' | 'added_recently' = 'added_recently',
  ) {
    const { offers, total } = await this.offersService.findNearbyOffers(lat, lng, order_by, Number(page), Number(limit), name);
    const result = this._i18nResponse.entity(plainToInstance(OfferResponse, offers, { excludeExtraneousValues: true }));
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Post('view-increment/:id')
  async viewCount(@Param('id') id: string) {
    return await this.offersService.viewIncrement(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Post('add-remove-favorite/:id')
  async addRemoveFavorite(@Param('id') id: string) {
    return new ActionResponse(await this.offersService.addRemoveFavorite(id));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Toggle Offer Active Status (Used/Not Used)' })
  @Post('toggle-active/:id')
  async toggleOfferStatus(@Param('id') id: string) {
    return new ActionResponse(await this.offersService.toggleOfferStatus(id));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @Get('favorite-offers')
  async getFavoriteOffers(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'images');
    applyQueryFilters(query, `stores.status=${StoreStatus.APPROVED},stores.is_active=1`);
    applyQueryIncludes(query, 'favorites');
    applyQueryFilters(query, `favorites.user_id=${this.request.user.id}`);
    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);
    const result = this._i18nResponse.entity(plainToInstance(OfferResponse, offers, { excludeExtraneousValues: true }));
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @Roles(Role.CLIENT, Role.STORE)
  @Get('details/:id')
  async getOfferById(@Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (!offer) throw new NotFoundException('Offer not found');
    offer.is_favorite = offer.favorites?.some(f => String(f.user_id) === String(this.request.user?.id)) ?? false;
    return new ActionResponse(this._i18nResponse.entity(plainToInstance(OfferResponse, offer, { excludeExtraneousValues: true })));
  }

  // ─── Store ─────────────────────────────────────────────────────────────────

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'is_active', required: false, type: Number, enum: [0, 1] })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Search in title_ar or title_en (case-insensitive)' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Offers with start_date >= this date or no start_date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'Offers with end_date <= this date or no end_date (YYYY-MM-DD)' })
  @Get('my-offers')
  async getStoreOffers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('is_active') is_active?: string,
    @Query('name') name?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    const { offers, total } = await this.offersService.getMyOffers({
      userId: (this.request.user as any).owner_user_id ?? this.request.user.id,
      page: Number(page),
      limit: Number(limit),
      is_active,
      name,
      start_date,
      end_date,
    });
    const result = plainToInstance(OfferResponse, offers, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Get('my-offers/:id')
  async getStoreOfferById(@Param('id') id: string) {
    const offer = await this.offersService.getStoreOfferById(id, this.request.user.id);
    return new ActionResponse(
      this._i18nResponse.entity(
        plainToInstance(OfferResponse, offer, { excludeExtraneousValues: true }),
      ),
    );
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Post()
  async createOffer(@Body() req: CreateOfferRequest) {
    return await this.offersService.createOffer(req);
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @ApiOperation({ summary: 'Get offer by code — validates the code is active and not expired' })
  @Get('code/:code')
  async getOfferByCode(@Param('code') code: string) {
    const offer = await this.offersService.getOfferByCode(code);
    return new ActionResponse(this._i18nResponse.entity(plainToInstance(OfferResponse, offer, { excludeExtraneousValues: true })));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Post('make-special/:id')
  async makeSpecialOffer(@Param('id') id: string) {
    return await this.offersService.makeSepcial(id);
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Put('store/update/:offer_id')
  async updateStoreOffer(@Param('offer_id') offer_id: string, @Body() req: UpdateStoreOfferRequest) {
    req.id = offer_id;
    return await this.offersService.updateOffer(req);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Get('admin/store')
  async adminGetAllStores(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQueryIncludes(query, 'city');
    const total = await this.storeService.count(query);
    const stores = await this.storeService.findAll(query);
    const result = plainToInstance(BranchResponse, stores, { excludeExtraneousValues: true });
    return new PaginatedResponse(this._i18nResponse.entity(result), { meta: { total, ...query } });
  }

  @AdminEndpoint()
  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @Delete('delete/:id')
  async deleteOffer(@Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (!offer) throw new NotFoundException('Offer not found');
    return await this.offersService.softDelete(id);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @ApiOperation({ summary: 'Toggle Offer Visibility (is_active)' })
  @Post('toggle-is-active/:id')
  async toggleOfferIsActive(@Param('id') id: string) {
    return new ActionResponse(await this.offersService.toggleOfferIsActive(id));
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Put('update')
  async updateOffer(@Body() req: UpdateOfferRequest) {
    return await this.offersService.updateOffer(req);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Put('update/:offer_id')
  async updateAdminOffer(@Param('offer_id') offer_id: string, @Body() req: UpdateAdminOfferRequest) {
    req.id = offer_id;
    return await this.offersService.updateOffer(req);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  async getAdminOffers(@Query() query: PaginatedRequest) {
    const storesId = this.extractStoreId(query.filters);
    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'images');
    applyQuerySort(query, 'created_at=DESC');
    applyQueryFilters(query, `stores.status=${StoreStatus.APPROVED},stores.is_active=1`);
    if (storesId) applyQueryFilters(query, `stores.status=${StoreStatus.APPROVED},stores.is_active=1,stores.id=${storesId}`);
    applyQueryIncludes(query, 'favorites');
    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);
    offers.forEach(o => { o.is_favorite = o.favorites?.some(f => String(f.user_id) === String(this.request.user.id)) ?? false; });
    return new PaginatedResponse(plainToInstance(OfferResponse, offers, { excludeExtraneousValues: true }), { meta: { total, ...query } });
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Get('admin/details/:id')
  async getAdminOfferById(@Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (!offer) throw new NotFoundException('Offer not found');
    return new ActionResponse(plainToInstance(OfferResponse, offer, { excludeExtraneousValues: true }));
  }

  private extractStoreId(filters: string | string[]): string | null {
    if (!filters) return null;
    const arr = Array.isArray(filters) ? filters : [filters];
    const f = arr.find(x => x.startsWith('stores.id='));
    return f ? f.substring('stores.id='.length) || null : null;
  }
}
