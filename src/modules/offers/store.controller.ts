import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { applyQueryFilters, applyQuerySort } from 'src/core/helpers/service-related.helper';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Permission } from '../authentication/guards/permission.decorator';
import { BranchResponse } from '../user/dto/branch.response';
import { UpdateBranchInfoRequest } from '../user/dto/request/update-store-info.request';
import { AddBranchRequest } from '../user/dto/request/add-branch.request';
import { UserService } from '../user/user.service';
import { OffersService } from './offers.service';
import { SubCategoryService } from './sub_category.service';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';

@ApiTags('Store')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@Controller('store')
export class StoreController {
  constructor(
    private readonly userService: UserService,
    private readonly offersService: OffersService,
    private readonly subCategoryService: SubCategoryService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
  ) {}

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('packages', 'view')
  @Get('packages')
  async getPackages() {
    const { packages, store, subscription } = await this.userService.getPackage();
    const storeResult = plainToInstance(BranchResponse, store, { excludeExtraneousValues: true });
    return new ActionResponse(this._i18nResponse.entity({ packages, store: storeResult, subscription }));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('offers', 'view')
  @ApiOperation({ summary: 'Get all active subcategories' })
  @Get('sub-categories')
  async getSubCategories(@Query() query: PaginatedRequest) {
    applyQueryFilters(query, 'is_active=1');
    applyQuerySort(query, 'order_by=asc');
    const [data, total] = await Promise.all([
      this.subCategoryService.findAll(query),
      this.subCategoryService.count(query),
    ]);
    const result = this._i18nResponse.entity(plainToInstance(SubCategory, data, { excludeExtraneousValues: true }));
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('packages', 'edit')
  @Post('subscribe/:package_id')
  async subscribePackage(@Param('package_id') package_id: string) {
    return new ActionResponse(await this.userService.subscribePackage(package_id));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('packages', 'view')
  @ApiOperation({ summary: 'Get current active subscription for the store' })
  @Get('subscription')
  async getCurrentSubscription() {
    return new ActionResponse(await this.userService.getCurrentSubscription());
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('branches', 'edit')
  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @Put('branches/:id')
  async updateBranchInfo(
    @Param('id') id: string,
    @Body() req: UpdateBranchInfoRequest,
    @UploadedFile(new UploadValidator().build())
    logo: Express.Multer.File,
  ) {
    req.branch_id = id;
    if (logo) {
      req.logo = logo;
    }
    return new ActionResponse(await this.userService.updateBranchInfo(req));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @Permission('branches', 'delete')
  @Delete('branches/:id')
  async deleteBranch(@Param('id') id: string) {
    return new ActionResponse(await this.userService.deleteBranch(id));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('branches', 'add')
  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @Post('branches')
  async addBranch(
    @Body() req: AddBranchRequest,
    @UploadedFile(new UploadValidator().build())
    logo: Express.Multer.File,
  ) {
    if (logo) {
      req.logo = logo;
    }
    return new ActionResponse(await this.userService.createBranch(req));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('branches', 'view')
  @ApiQuery({ name: 'is_active', required: false, type: Number, enum: [0, 1] })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by branch name (case-insensitive)' })
  @ApiQuery({ name: 'city_id', required: false, type: String })
  @Get('branches')
  async getBranches(
    @Query('is_active') is_active?: string,
    @Query('name') name?: string,
    @Query('city_id') city_id?: string,
  ) {
    const isActiveBool = is_active !== undefined && is_active !== '' ? is_active === '1' || is_active === 'true' : undefined;
    const branches = await this.userService.getBranches(isActiveBool, name, city_id);
    const result = plainToInstance(BranchResponse, branches, { excludeExtraneousValues: true });
    return new ActionResponse(this._i18nResponse.entity(result));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('branches', 'view')
  @ApiOperation({ summary: 'Get all cities' })
  @Get('cities')
  async getCities() {
    const cities = await this.userService.getCities();
    return new ActionResponse(this._i18nResponse.entity(cities));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('branches', 'view')
  @Get('branches/:id')
  async getBranchById(@Param('id') id: string) {
    const branch = await this.userService.getBranchById(id);
    const result = plainToInstance(BranchResponse, branch, { excludeExtraneousValues: true });
    return new ActionResponse(this._i18nResponse.entity(result));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('dashboard', 'view')
  @ApiOperation({ summary: 'Dashboard summary cards + monthly performance + daily usage charts' })
  @Get('dashboard')
  async getDashboard() {
    return new ActionResponse(await this.offersService.getStoreDashboard());
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('reports', 'view')
  @ApiOperation({ summary: 'Top used offers table + branch performance comparison' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max offers to return (default 10)' })
  @Get('top-offers')
  async getTopOffers(@Query('limit') limit = 10) {
    return new ActionResponse(await this.offersService.getTopOffersPerformance(Number(limit)));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('reports', 'view')
  @ApiOperation({ summary: 'Store performance reports' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'], description: 'Preset date period' })
  @ApiQuery({ name: 'branch_id', required: false, type: String, description: 'Filter by branch' })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Custom start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Custom end date (YYYY-MM-DD)' })
  @Get('reports')
  async getReports(
    @Query('period') period?: string,
    @Query('branch_id') branch_id?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    const report = await this.offersService.getStoreReports(period, branch_id, date_from, date_to);
    return new ActionResponse(report);
  }
}
