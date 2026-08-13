import { Module } from '@nestjs/common';
import { ContactUsService } from './contact-us.service';
import { ContactUsController } from './contact-us.controller';
import { SupportTicketModule } from '../support-ticket/support-ticket.module';

@Module({
  imports: [SupportTicketModule],
  providers: [ContactUsService],
  controllers: [ContactUsController],
})
export class ContactUsModule {}
