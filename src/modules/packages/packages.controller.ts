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
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import {
  CreatePackageRequest,
  UpdatePackageRequest,
} from './dto/request/create-package.request';
import { ActionResponse } from 'src/core/base/responses/action.response';
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get('/all')
  async getPackages() {
    return new ActionResponse( await this.packagesService.getPackages());
  }

  @Post('/create')
  createPackage(@Body() data: CreatePackageRequest) {
    return this.packagesService.createPackage(data);
  }

  @Put('/update/:id')
  updatePackage(@Param('id') id: string,@Body() data: UpdatePackageRequest) {
    return this.packagesService.updatePackage(id,data);
  }

  @Delete('/delete/:id')
  deletePackage(@Param('id') id: string) {
    return this.packagesService.deletePackage(id);
  }
}
