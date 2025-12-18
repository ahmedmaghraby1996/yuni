import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';

@Injectable()
export class StoreSeeder implements Seeder {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const fileContent = fs.readFileSync('./json/store.json', 'utf8');
    const jsonData = JSON.parse(fileContent);

    // Find the store user
    const storeUser = await this.userRepository.findOne({
      where: { id: 'store_user' },
    });

    for (const storeData of jsonData) {
      const store = this.storeRepository.create({
        ...storeData,
        user_id: storeUser?.id || null,
      });
      await this.storeRepository.save(store);
    }

    console.log('Stores seeded successfully.');
  }

  async drop(): Promise<void> {
    await this.storeRepository.clear();
    console.log('Store table cleared.');
  }
}

