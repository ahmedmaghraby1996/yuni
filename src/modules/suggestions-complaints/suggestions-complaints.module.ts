import { Module } from '@nestjs/common';
import { SuggestionsComplaintsController } from './suggestions-complaints.controller';
import { SuggestionsComplaintsService } from './suggestions-complaints.service';

@Module({
  controllers: [SuggestionsComplaintsController],
  providers: [SuggestionsComplaintsService]
})
export class SuggestionsComplaintsModule {}
