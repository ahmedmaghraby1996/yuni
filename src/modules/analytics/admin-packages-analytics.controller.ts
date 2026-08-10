import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { AdminPackagesService } from './admin-packages-analytics.service';

@ApiTags('Admin Packages')
@AdminEndpoint()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/packages')
export class AdminPackagesController {
  constructor(private readonly service: AdminPackagesService) {}

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('dashboard')
  async getDashboard(@Query('page') page = 1, @Query('limit') limit = 10) {
    return new ActionResponse(await this.service.getDashboard(Number(page), Number(limit)));
  }
}
