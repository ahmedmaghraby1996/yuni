import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
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

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get(':user_id')
  async getStoresByUserId(
    @Param('user_id') user_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const { stores, total } = await this.adminStoreService.getStoresByUserId(
      user_id,
      Number(page),
      Number(limit),
    );
    const result = plainToInstance(BranchResponse, stores, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }


  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get(':user_id/offers')
  async getStoreOffers(
    @Param('user_id') user_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const { data, total } = await this.adminStoreService.getStoreOffers(user_id, Number(page), Number(limit));
    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get(':user_id/subscriptions')
  async getSubscriptionsByUserId(
    @Param('user_id') user_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const { subscriptions, total } = await this.adminStoreService.getSubscriptionsByUserId(
      user_id,
      Number(page),
      Number(limit),
    );
    return new PaginatedResponse(subscriptions, { meta: { total, page: Number(page), limit: Number(limit) } });
  }
}
