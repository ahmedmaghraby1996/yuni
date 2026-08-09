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
import { SupportTicketModule } from './support-ticket/support-ticket.module';
import { StoreEmployeeModule } from './store-employee/store-employee.module';
import { StoreProfileModule } from './store-profile/store-profile.module';
import { StoreSuggestionModule } from './store-suggestion/store-suggestion.module';
import { AdminStoreModule } from './admin-store/admin-store.module';
import { AdminHomeModule } from './admin-home/admin-home.module';
import { AdminEmployeeModule } from './admin-employee/admin-employee.module';

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
    CategoryModule,
    SupportTicketModule,
    StoreEmployeeModule,
    StoreProfileModule,
    StoreSuggestionModule,
    AdminStoreModule,
    AdminHomeModule,
    AdminEmployeeModule,
  ],
  exports: [],
})
export class AssemblyModule {}
