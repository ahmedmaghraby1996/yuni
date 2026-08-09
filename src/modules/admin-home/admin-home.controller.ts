import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { AdminHomeService } from './admin-home.service';
import { Request } from 'express';

@ApiTags('Admin Home')
@AdminEndpoint()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/home')
export class AdminHomeController {
  constructor(private readonly adminHomeService: AdminHomeService) {}

  @Get()
  async getStats() {
    return new ActionResponse(await this.adminHomeService.getStats());
  }

  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '12m'], description: 'Default: 7d' })
  @Get('revenue')
  async getRevenueChart(@Query('period') period: '7d' | '30d' | '12m' = '7d') {
    return new ActionResponse(await this.adminHomeService.getRevenueChart(period));
  }

  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default: 10' })
  @Get('top-stores')
  async getTopStores(@Query('limit') limit = 10) {
    return new ActionResponse(await this.adminHomeService.getTopStores(Number(limit)));
  }

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('pending-requests')
  async getPendingRequests(@Query('page') page = 1, @Query('limit') limit = 10) {
    return new ActionResponse(await this.adminHomeService.getPendingRequests(Number(page), Number(limit)));
  }

  @Post('send-expiry-reminders')
  async sendExpiryReminders(@Req() req: Request) {
    return new ActionResponse(await this.adminHomeService.sendExpiryReminders((req.user as any).id));
  }
}
