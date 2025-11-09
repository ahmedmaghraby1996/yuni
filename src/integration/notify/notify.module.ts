import { Module } from '@nestjs/common';
import { FcmIntegrationService } from './fcm-integration.service';
import { FcmModule, FcmService } from 'nestjs-fcm';
import { join } from 'path';
import { FirebaseAdminService } from 'src/modules/notification/firebase-admin-service';

@Module({
  imports: [
    FcmModule.forRoot({
  firebaseSpecsPath: join(__dirname, '../../../firebase.spec.json'),
    }),
  ],
  providers: [FcmIntegrationService,FirebaseAdminService],
  exports: [FcmIntegrationService,FirebaseAdminService],
})
export class NotifyModule {}
