import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';

@Injectable()
export class OfferSeeder implements Seeder {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async seed(): Promise<void> {
    const fileContent = fs.readFileSync('./json/offer.json', 'utf8');
    const jsonData = JSON.parse(fileContent);

    const stores = await this.storeRepository.find();
    const subcategories = await this.subCategoryRepository.find();

    for (const offerData of jsonData) {
      const { store_index, subcategory_index, ...data } = offerData;
      const offer = this.offerRepository.create(data);
      
      if (stores[store_index]) {
        offer.stores = [stores[store_index]];
      }

      if (subcategories[subcategory_index]) {
        offer.subcategory = subcategories[subcategory_index];
      }
      
      await this.offerRepository.save(offer);
    }

    console.log('Offers seeded successfully.');
  }

  async drop(): Promise<void> {
    await this.offerRepository.clear();
    console.log('Offer table cleared.');
  }
}

