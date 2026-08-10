import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import {
  CreatePackageRequest,
  UpdatePackageRequest,
} from './dto/request/create-package.request';
import { ActionResponse } from 'src/core/base/responses/action.response';

@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@AdminEndpoint()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  async getPackages() {
    return new ActionResponse(await this.packagesService.getPackages());
  }

  @Get('analytics')
  async getAnalytics() {
    return new ActionResponse(await this.packagesService.getAnalytics());
  }

  @Get(':id')
  async getPackageById(@Param('id') id: string) {
    return new ActionResponse(await this.packagesService.getPackageById(id));
  }


  @Post()
  createPackage(@Body() data: CreatePackageRequest) {
    return this.packagesService.createPackage(data);
  }

  @Put(':id')
  updatePackage(@Param('id') id: string, @Body() data: UpdatePackageRequest) {
    return this.packagesService.updatePackage(id, data);
  }

  @Delete(':id')
  deletePackage(@Param('id') id: string) {
    return this.packagesService.deletePackage(id);
  }
}
