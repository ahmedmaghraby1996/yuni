import { UserService } from './user.service';
import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators';
import { UserController } from './user.controller';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionModule } from '../transaction/transaction.module';
import { NotificationModule } from '../notification/notification.module';

@Global()
@Module({
    imports: [TransactionModule,NotificationModule],
    controllers: [UserController],
    providers: [UserService,TransactionService],
    exports: [UserService]
})
export class UserModule { }
