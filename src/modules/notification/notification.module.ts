import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './controllers/notification.controller';
import { FcmIntegrationService } from '../../integration/notify/fcm-integration.service';
import { NotificationService } from './services/notification.service';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { UserService } from '../user/user.service';
import { NotifyModule } from 'src/integration/notify/notify.module';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { FirebaseAdminService } from './firebase-admin-service';
import { TransactionService } from '../transaction/transaction.service';
import { OfferUsage } from 'src/infrastructure/entities/offer/offer-usage.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      User,
      OfferUsage,
      Store,
    ]),
    NotifyModule,
  ],
  controllers: [
    NotificationController
  ],
  providers: [
    NotificationService,
    FcmIntegrationService,
    I18nResponse,
    UserService,
    TransactionService

  ],
  exports: [
    NotificationModule,
    NotificationService,
 
  ],
})
export class NotificationModule { }
