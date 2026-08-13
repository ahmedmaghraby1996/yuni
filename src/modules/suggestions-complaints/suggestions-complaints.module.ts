import { Module } from '@nestjs/common';
import { SuggestionsComplaintsController } from './suggestions-complaints.controller';
import { SuggestionsComplaintsService } from './suggestions-complaints.service';
import { SupportTicketModule } from '../support-ticket/support-ticket.module';

@Module({
  imports: [SupportTicketModule],
  controllers: [SuggestionsComplaintsController],
  providers: [SuggestionsComplaintsService],
})
export class SuggestionsComplaintsModule {}
