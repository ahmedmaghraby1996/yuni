import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { AdminAuthController } from './admin-auth.controller';
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreEmployee } from 'src/infrastructure/entities/store/store-employee.entity';
import { AdminEmployee } from 'src/infrastructure/entities/admin/admin-employee.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Otp } from 'src/infrastructure/entities/auth/otp.entity';
import { RegisterUserTransaction } from './transactions/register-user.transaction';
import { SendOtpTransaction } from './transactions/send-otp.transaction';
import { JwtService } from '@nestjs/jwt';
import { VerifyOtpTransaction } from './transactions/verify-otp.transaction';
import { JwtStrategy } from './strategies/jwt.strategy';
import JWTSetup from 'src/core/setups/jwt.setup';


import { FileService } from '../file/file.service';
import { NotificationModule } from '../notification/notification.module';
import { NotificationService } from '../notification/services/notification.service';
import { FcmIntegrationService } from 'src/integration/notify/fcm-integration.service';

import { TransactionService } from '../transaction/transaction.service';
import { FirebaseAdminService } from '../notification/firebase-admin-service';
import { SendEmailModule } from '../send-email/send-email.module';
import { SendEmailService } from '../send-email/send-email.service';
import { SmsService } from '../send-email/sms-service';
import { HttpModule } from '@nestjs/axios';
// 
@Global()
@Module({
  imports: [JWTSetup(), HttpModule, TypeOrmModule.forFeature([User, StoreEmployee, AdminEmployee, Otp])],
  controllers: [AuthenticationController, AdminAuthController],
  providers: [
    AuthenticationService,
    RegisterUserTransaction,
    SendOtpTransaction,
    VerifyOtpTransaction,
    JwtService,
    SendEmailService,
    JwtStrategy,
    FileService,
    NotificationService,
    SmsService,
    FcmIntegrationService
    ,TransactionService

  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
