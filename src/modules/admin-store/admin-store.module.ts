import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Promotion } from 'src/infrastructure/entities/promotion/promotion.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { AdminStoreService } from './admin-store.service';
import { AdminStoreController } from './admin-store.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Promotion, Subscription])],
  controllers: [AdminStoreController],
  providers: [AdminStoreService],
})
export class AdminStoreModule {}
