import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { Repository } from 'typeorm';
import {
  CreateCategoryRequest,
  CreateSubCategoryRequest,
  UpdateCategoryRequest,
  UpdateSubCategoryRequest,
} from './dto/request/create-category.request';
import { FileService } from '../file/file.service';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CategoryService extends BaseService<Category> {
  constructor(
    @InjectRepository(Category) public readonly repo: Repository<Category>,
    private readonly _fileService: FileService,
    @InjectRepository(SubCategory) public readonly subCategoryRepo: Repository<SubCategory>,
  ) {
    super(repo);
  }

  async createCategory(req: CreateCategoryRequest) {
    const tempImage = await this._fileService.upload(req.logo, `categories`);

    return await this.repo.save({
      name_ar: req.name_ar,
      name_en: req.name_en,
      logo: tempImage,
      is_active: req.is_active,
      order_by: req.order_by,
    });
  }

  async updateCategory(id: string, req: UpdateCategoryRequest) {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('message.category_not_found');
    }

    let tempImage = null;

    if (req.logo) {
      tempImage = await this._fileService.upload(req.logo, 'categories');
    }

    Object.assign(category, {
      name_ar: req.name_ar ?? category.name_ar,
      name_en: req.name_en ?? category.name_en,
      logo: req.logo ? tempImage : category.logo,
      order_by: req.order_by ?? category.order_by,
      is_active: req.is_active != null ? req.is_active : category.is_active,
    });

    return await this.repo.save(category);
  }

  async createSubCategory(req: CreateSubCategoryRequest) {
  // const tempImage = await this._fileService.upload(req.logo, `subcategories`);
    const subCategory = plainToInstance(SubCategory, {
      name_ar: req.name_ar,
      name_en: req.name_en,
      // logo: tempImage,
      is_active: req.is_active,
      order_by: req.order_by,
    })
  return await this.subCategoryRepo.save(subCategory);
}

async updateSubCategory(id: string, req: UpdateSubCategoryRequest) {
  const subCategory = await this.subCategoryRepo.findOne({ where: { id } });
  if (!subCategory) {
    throw new NotFoundException('message.subcategory_not_found');
  }

  let tempImage = null;

  if (req.logo) {
    tempImage = await this._fileService.upload(req.logo, 'subcategories');
  }

  Object.assign(subCategory, {
    name_ar: req.name_ar ?? subCategory.name_ar,
    name_en: req.name_en ?? subCategory.name_en,
    logo: req.logo ? tempImage : subCategory.logo,
    order_by: req.order_by ?? subCategory.order_by,
    is_active: req.is_active != null ? req.is_active : subCategory.is_active,
    category_id: req.category_id ?? subCategory.category_id,
  });

  return await this.subCategoryRepo.save(subCategory);
}

}
