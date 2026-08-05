import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreSuggestion } from 'src/infrastructure/entities/store-suggestion/store-suggestion.entity';
import { StoreSuggestionService } from './store-suggestion.service';
import { StoreSuggestionController } from './store-suggestion.controller';
import { FileService } from '../file/file.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreSuggestion])],
  controllers: [StoreSuggestionController],
  providers: [StoreSuggestionService, FileService],
})
export class StoreSuggestionModule {}
