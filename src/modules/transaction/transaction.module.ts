import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService,TransactionModule],
})
export class TransactionModule {}
