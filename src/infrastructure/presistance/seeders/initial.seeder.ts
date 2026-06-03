import { CategorySeeder } from './category.seeder';
import { CitySeeder } from './city.seeder';
import { StaticPageSeeder } from './static-pages.seeder';
import { UsersSeeder } from './users.seeder';
import { BannerSeeder } from './banner.seeder';
import { StoreSeeder } from './store.seeder';
import { OfferSeeder } from './offer.seeder';
import { FaqSeeder } from './faq.seeder';
import { AdminUserSeeder } from './admin-user.seeder';
import { PackagesSeeder } from './packages.seeder';

export const DB_SEEDERS = [
  AdminUserSeeder,
  PackagesSeeder,
  // UsersSeeder,
  // AddressSeeder,
  // CitySeeder,
  // StaticPageSeeder,
  // CategorySeeder,
  // BannerSeeder,
  // StoreSeeder,
  // OfferSeeder,
  FaqSeeder,
];
