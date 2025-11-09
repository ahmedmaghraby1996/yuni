import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { SubCategoryService } from '../offers/sub_category.service';
import { FileService } from '../file/file.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService,SubCategoryService,FileService],
})
export class CategoryModule {}
