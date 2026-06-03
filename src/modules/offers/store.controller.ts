import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { applyQueryFilters, applyQueryIncludes } from 'src/core/helpers/service-related.helper';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { BranchResponse } from '../user/dto/branch.response';
import { OfferResponse } from './dto/responses/offer-response';
import { StoreOfferUserResponse } from './dto/responses/store-offer-user.response';
import { CreateOfferRequest } from './dto/requests/create-offer.request';
import { UpdateBranchInfoRequest, UpdateStoreInfoRequest } from '../user/dto/request/update-store-info.request';
import { AddBranchRequest } from '../user/dto/request/add-branch.request';
import { OffersService } from './offers.service';
import { UserService } from '../user/user.service';

@ApiTags('Store')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@Controller('store')
export class StoreController {
  constructor(
    private readonly offersService: OffersService,
    private readonly userService: UserService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  // ─── Store Owner ──────────────────────────────────────────────────────────

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Get('packages')
  async getPackages() {
    const packages = await this.userService.getPackage();
    return new ActionResponse(this._i18nResponse.entity(packages));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Post('subscribe/:package_id')
  async subscribePackage(@Param('package_id') package_id: string) {
    return new ActionResponse(await this.userService.buyPackage(package_id));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Get('offers')
  async getMyOffers(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'stores');
    applyQueryIncludes(query, 'subcategory');
    applyQueryIncludes(query, 'images');
    applyQueryFilters(query, `user_id=${this.request.user.id}`);
    const total = await this.offersService.count(query);
    const offers = await this.offersService.findAll(query);
    const result = plainToInstance(OfferResponse, offers, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Post('offers')
  async createOffer(@Body() req: CreateOfferRequest) {
    return await this.offersService.createOffer(req);
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @Delete('offers/:id')
  async deleteOffer(@Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (!offer) throw new NotFoundException('Offer not found');
    return await this.offersService.softDelete(id);
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE)
  @Post('offers/:id/make-special')
  async makeSpecialOffer(@Param('id') id: string) {
    return await this.offersService.makeSepcial(id);
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @ApiOperation({ summary: 'Toggle Offer Visibility (is_active)' })
  @Post('offers/:id/toggle-visible')
  async toggleOfferVisible(@Param('id') id: string) {
    return new ActionResponse(await this.offersService.toggleOfferIsActive(id));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @ApiOperation({ summary: 'Users who activated store offers with codes count' })
  @Get('offer-users')
  async getOfferUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    const { results, total } = await this.offersService.getStoreOfferUsers(Number(page), Number(limit));
    const data = plainToInstance(StoreOfferUserResponse, results, { excludeExtraneousValues: true });
    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @StoreEndpoint()
  @UseInterceptors(ClassSerializerInterceptor, FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'catalogue', maxCount: 1 },
  ]))
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @Roles(Role.STORE)
  @Put('info')
  async updateStoreInfo(
    @Body() req: UpdateStoreInfoRequest,
    @UploadedFiles() files: { logo?: Express.Multer.File[]; catalogue?: Express.Multer.File[] },
  ) {
    if (files?.logo?.[0]) req.logo = files.logo[0];
    if (files?.catalogue?.[0]) req.catalogue = files.catalogue[0];
    return new ActionResponse(await this.userService.updateMainStoreInfo(req));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Put('branch')
  async updateBranchInfo(@Body() req: UpdateBranchInfoRequest) {
    return new ActionResponse(await this.userService.updateBranchInfo(req));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @Delete('branch/:id')
  async deleteBranch(@Param('id') id: string) {
    return new ActionResponse(await this.userService.deleteBranch(id));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Post('branch')
  async addBranch(@Body() req: AddBranchRequest) {
    return new ActionResponse(await this.userService.createBranch(req));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Get('branches')
  async getBranches() {
    const branches = await this.userService.getBranches();
    const result = plainToInstance(BranchResponse, branches, { excludeExtraneousValues: true });
    return new ActionResponse(this._i18nResponse.entity(result));
  }

}
