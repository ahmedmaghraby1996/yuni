import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubcategoryService extends BaseService<SubCategory> {
    constructor(@InjectRepository(SubCategory) public readonly repo: Repository<SubCategory>) {
        super(repo);
    }
}
