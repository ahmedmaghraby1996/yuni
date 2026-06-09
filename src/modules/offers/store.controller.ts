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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { BranchResponse } from '../user/dto/branch.response';
import { UpdateBranchInfoRequest, UpdateStoreInfoRequest } from '../user/dto/request/update-store-info.request';
import { AddBranchRequest } from '../user/dto/request/add-branch.request';
import { UserService } from '../user/user.service';

@ApiTags('Store')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@Controller('store')
export class StoreController {
  constructor(
    private readonly userService: UserService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
  ) {}

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Get('packages')
  async getPackages() {
    const packages = await this.userService.getPackage();
    return new ActionResponse(this._i18nResponse.entity(packages));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('subscribe/:package_id')
  async subscribePackage(@Param('package_id') package_id: string) {
    return new ActionResponse(await this.userService.buyPackage(package_id));
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
  @Put('branches/:id')
  async updateBranchInfo(@Param('id') id: string, @Body() req: UpdateBranchInfoRequest) {
    req.branch_id = id;
    return new ActionResponse(await this.userService.updateBranchInfo(req));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE, Role.ADMIN)
  @Delete('branches/:id')
  async deleteBranch(@Param('id') id: string) {
    return new ActionResponse(await this.userService.deleteBranch(id));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Post('branches')
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

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Get('branches/:id')
  async getBranchById(@Param('id') id: string) {
    const branch = await this.userService.getBranchById(id);
    const result = plainToInstance(BranchResponse, branch, { excludeExtraneousValues: true });
    return new ActionResponse(this._i18nResponse.entity(result));
  }
}
