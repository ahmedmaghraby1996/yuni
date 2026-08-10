import { Module } from '@nestjs/common';
import { StoreProfileController } from './store-profile.controller';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [PackagesModule],
  controllers: [StoreProfileController],
})
export class StoreProfileModule {}
