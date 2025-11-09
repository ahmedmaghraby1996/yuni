import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Repository } from 'typeorm';
import {
  CreatePackageRequest,
  UpdatePackageRequest,
} from './dto/request/create-package.request';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
  ) {}
  async getPackages() {
     return await this.packageRepo.find({ order: { order_by: 'ASC' } });
  }

  async createPackage(data: CreatePackageRequest) {
    const get_package = plainToInstance(Package, data);
    return await this.packageRepo.save(get_package);
  }

  async   updatePackage(id: string,data: UpdatePackageRequest) {
    const get_package = await this.packageRepo.findOne({
      where: { id: id },
    });
    if (!get_package) throw new NotFoundException('package not found');
    return await this.packageRepo.update(get_package.id, data);
  }

  async deletePackage(id: string) {
    const item = await this.packageRepo.findOne({
      where: { id: id },
    });
    if (!item) throw new NotFoundException('package not found');
    return await this.packageRepo.softRemove(item);
  }
}
