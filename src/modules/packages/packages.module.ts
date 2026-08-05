import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Package, Subscription])],
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
