import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPackagesController } from './admin-packages-analytics.controller';
import { AdminPackagesService } from './admin-packages-analytics.service';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { OfferUsage } from 'src/infrastructure/entities/offer/offer-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Package, Subscription, Transaction, User, Store, OfferUsage])],
  controllers: [AdminPackagesController],
  providers: [AdminPackagesService],
})
export class AdminPackagesModule {}
