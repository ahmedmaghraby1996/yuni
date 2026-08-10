import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Permission } from '../authentication/guards/permission.decorator';
import { BranchResponse } from '../user/dto/branch.response';
import { UpdateStoreInfoRequest } from '../user/dto/request/update-store-info.request';
import { UserService } from '../user/user.service';
import { PackagesService } from '../packages/packages.service';

@ApiTags('Store Profile')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store/profile')
export class StoreProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly packagesService: PackagesService,
  ) {}

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('profile', 'view')
  @ApiOperation({ summary: 'Get store profile (main branch info)' })
  @Get()
  async getProfile() {
    const store = await this.userService.getMainStore();
    return new ActionResponse(plainToInstance(BranchResponse, store, { excludeExtraneousValues: true }));
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('profile', 'edit')
  @ApiOperation({ summary: 'Update store profile' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'catalogue', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 },
    { name: 'commercial_registration', maxCount: 1 },
    { name: 'vat_certificate', maxCount: 1 },
  ]))
  @ApiConsumes('multipart/form-data')
  @Put()
  async updateProfile(
    @Body() req: UpdateStoreInfoRequest,
    @UploadedFiles() files: {
      logo?: Express.Multer.File[];
      catalogue?: Express.Multer.File[];
      cover_image?: Express.Multer.File[];
      commercial_registration?: Express.Multer.File[];
      vat_certificate?: Express.Multer.File[];
    },
  ) {
    if (files?.logo?.[0]) req.logo = files.logo[0];
    if (files?.catalogue?.[0]) req.catalogue = files.catalogue[0];
    if (files?.cover_image?.[0]) req.cover_image = files.cover_image[0];
    if (files?.commercial_registration?.[0]) req.commercial_registration = files.commercial_registration[0];
    if (files?.vat_certificate?.[0]) req.vat_certificate = files.vat_certificate[0];
    const store = await this.userService.updateMainStoreInfo(req);
    return new ActionResponse(plainToInstance(BranchResponse, store, { excludeExtraneousValues: true }));
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiTags('Store Packages')
  @Get('package/:id')
  async getPackageById(@Param('id') id: string) {
    return new ActionResponse(await this.packagesService.getPackageById(id));
  }
}
