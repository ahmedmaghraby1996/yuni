import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';

export class MakeTransactionRequest {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    enum: TransactionTypes,
    enumName: 'TransactionTypes',
    default: TransactionTypes.AGENT_PAYMENT,
  })
  type: TransactionTypes = TransactionTypes.AGENT_PAYMENT;

  @ApiProperty()
  @IsString()
  user_id: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  iban?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  date?: string;

  constructor(partial?: Partial<MakeTransactionRequest>) {
    Object.assign(this, partial);
  }
}

export class WalletChargeRequest {
  @ApiProperty({ description: 'Amount to add to wallet' })
  @IsNumber()
  amount: number;
}

export class WalletRefundRequest {
  @ApiProperty({ description: 'Amount to refund from wallet' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Reason for the refund' })
  @IsString()
  reason: string;
}

export class setAgentPercentageRequest {
  @ApiProperty()
  @IsNumber()
  @Max(100)
  @Min(0)
  percentage: number;
}
