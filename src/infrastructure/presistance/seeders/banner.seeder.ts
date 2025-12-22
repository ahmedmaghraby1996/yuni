import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Banar } from 'src/infrastructure/entities/banar/banar.entity';

@Injectable()
export class BannerSeeder implements Seeder {
  constructor(
    @InjectRepository(Banar)
    private readonly banarRepository: Repository<Banar>,
  ) {}

  async seed(): Promise<void> {
    const fileContent = fs.readFileSync('./json/banner.json', 'utf8');
    const jsonData = JSON.parse(fileContent);

    for (const bannerData of jsonData) {
      const banner = this.banarRepository.create(bannerData);
      await this.banarRepository.save(banner);
    }

    console.log('Banners seeded successfully.');
  }

  async drop(): Promise<void> {
    await this.banarRepository.clear();
    console.log('Banner table cleared.');
  }
}


