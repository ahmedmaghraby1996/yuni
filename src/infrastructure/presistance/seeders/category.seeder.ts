import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { plainToInstance } from 'class-transformer';
import { Country } from 'src/infrastructure/entities/country/country.entity';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';

@Injectable()
export class CategorySeeder implements Seeder {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async seed(): Promise<void> {
    const fileContent = fs.readFileSync('./json/category.json', 'utf8');
    const jsonData = JSON.parse(fileContent);
    for (const categoryData of jsonData) {
      const category = this.categoryRepository.create(
        categoryData,
      ) as unknown as Category;
      const savedCategory = await this.categoryRepository.save(category);

      for (const subcategoryData of categoryData.subcategories) {
        const subcategory = this.subCategoryRepository.create(
          subcategoryData,
        ) as unknown as SubCategory;
        subcategory.category = savedCategory;
        await this.subCategoryRepository.save(subcategory);
      }
    }

    console.log('Categories and subcategories seeded successfully.');
  }

  async drop(): Promise<void> {
    await this.subCategoryRepository.clear();
    await this.categoryRepository.clear();
    console.log('City and country tables cleared.');
  }
}
