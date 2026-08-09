import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Offer } from 'src/infrastructure/entities/offer/offer.entity';
import { SystemVariable } from 'src/infrastructure/entities/system-variables/system-variable.entity';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { FirebaseAdminService } from '../notification/firebase-admin-service';
import { AdminHomeController } from './admin-home.controller';
import { AdminHomeService } from './admin-home.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Store, Subscription, Offer, SystemVariable, Transaction, NotificationEntity])],
  controllers: [AdminHomeController],
  providers: [AdminHomeService, FirebaseAdminService],
})
export class AdminHomeModule {}
