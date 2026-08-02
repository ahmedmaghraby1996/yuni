import { Module } from '@nestjs/common';
import { StoreProfileController } from './store-profile.controller';

@Module({
  controllers: [StoreProfileController],
})
export class StoreProfileModule {}
