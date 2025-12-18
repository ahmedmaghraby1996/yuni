import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Store } from 'src/infrastructure/entities/store/store.entity';

@Injectable()
export class StoreSeeder implements Seeder {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async seed(): Promise<void> {
    const fileContent = fs.readFileSync('./json/store.json', 'utf8');
    const jsonData = JSON.parse(fileContent);

    for (const storeData of jsonData) {
      const store = this.storeRepository.create(storeData);
      await this.storeRepository.save(store);
    }

    console.log('Stores seeded successfully.');
  }

  async drop(): Promise<void> {
    await this.storeRepository.clear();
    console.log('Store table cleared.');
  }
}

