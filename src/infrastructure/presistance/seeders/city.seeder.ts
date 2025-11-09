import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { plainToInstance } from 'class-transformer';
import { Country } from 'src/infrastructure/entities/country/country.entity';

@Injectable()
export class CitySeeder implements Seeder {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,

    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async seed(): Promise<void> {
    const fileContent = fs.readFileSync('./json/cities.json', 'utf8');
    const jsonData = JSON.parse(fileContent);

    const countryData = jsonData.country;

    const country = new Country({
      name_ar: countryData.name_ar,
      name_en: countryData.name_en,
    });
    const savedCountry = await this.countryRepository.save(country);

    for (const cityData of countryData.cities) {
      const city = new City({
        name_ar: cityData.name_ar,
        name_en: cityData.name_en,
        country: savedCountry,
      });

      await this.cityRepository.save(city);
    }

    console.log('Cities and country seeded successfully.');
  }

  async drop(): Promise<void> {
    await this.cityRepository.clear();
    await this.countryRepository.clear();
    console.log('City and country tables cleared.');
  }
}
