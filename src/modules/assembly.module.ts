import { Module } from '@nestjs/common';

import { NotificationModule } from './notification/notification.module';

import { TransactionModule } from './transaction/transaction.module';

import { SuggestionsComplaints } from 'src/infrastructure/entities/suggestions-complaints/suggestions-complaints.entity';
import { SuggestionsComplaintsModule } from './suggestions-complaints/suggestions-complaints.module';
import { StaticPageModule } from './static-page/static-page.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { FaqModule } from './faq/faq.module';
import { SendEmailModule } from './send-email/send-email.module';
import { OffersModule } from './offers/offers.module';
import { FileModule } from './file/file.module';
import { BanarModule } from './banar/banar.module';
import { ChatModule } from './chat/chat.module';
import { PackagesModule } from './packages/packages.module';
import { CategoryModule } from './category/category.module';


@Module({
  imports: [
    NotificationModule,
    SuggestionsComplaintsModule,
    StaticPageModule,
    ContactUsModule,
    FaqModule,
    SendEmailModule,
    TransactionModule,
    OffersModule,
    FileModule,
    BanarModule,
    ChatModule,
    PackagesModule,
    CategoryModule
  ],
  exports: [],
})
export class AssemblyModule {}
