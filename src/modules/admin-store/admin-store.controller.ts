import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { AdminPermission } from '../authentication/guards/admin-permission.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { BranchResponse } from '../user/dto/branch.response';
import { AdminStoreService } from './admin-store.service';

@ApiTags('Admin Stores')
@AdminEndpoint()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/stores')
export class AdminStoreController {
  constructor(private readonly adminStoreService: AdminStoreService) {}

  @AdminPermission('stores', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'is_active', required: false, enum: ['0', '1'] })
  @Get(':user_id')
  async getStoresByUserId(
    @Param('user_id') user_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('is_active') is_active?: string,
  ) {
    const isActiveBool = is_active !== undefined && is_active !== '' ? is_active === '1' || is_active === 'true' : undefined;
    const { stores, total } = await this.adminStoreService.getStoresByUserId(user_id, Number(page), Number(limit), name, isActiveBool);
    const result = plainToInstance(BranchResponse, stores, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @AdminPermission('stores', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'is_active', required: false, enum: ['0', '1'] })
  @Get(':user_id/offers')
  async getStoreOffers(
    @Param('user_id') user_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('is_active') is_active?: string,
  ) {
    const isActiveBool = is_active !== undefined && is_active !== '' ? is_active === '1' || is_active === 'true' : undefined;
    const { data, total } = await this.adminStoreService.getStoreOffers(user_id, Number(page), Number(limit), name, isActiveBool);
    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @AdminPermission('stores', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'From date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'To date (YYYY-MM-DD)' })
  @Get(':user_id/subscriptions')
  async getSubscriptionsByUserId(
    @Param('user_id') user_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    const { subscriptions, total } = await this.adminStoreService.getSubscriptionsByUserId(user_id, Number(page), Number(limit), date_from, date_to);
    return new PaginatedResponse(subscriptions, { meta: { total, page: Number(page), limit: Number(limit) } });
  }
}
