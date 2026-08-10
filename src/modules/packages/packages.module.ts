import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Package, Subscription, Transaction])],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
