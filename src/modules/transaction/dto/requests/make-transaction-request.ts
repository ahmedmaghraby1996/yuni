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

  //add iban
  @ApiProperty({required:false})
  @IsString()
  @IsOptional()
  iban?: string;
  // bank
  @ApiProperty({required:false})
  @IsString()
    @IsOptional()
  bank?: string;

  // add date
  @ApiProperty({ required: false })
  @IsString()
    @IsOptional()
  date?: string;


  constructor(partial?: Partial<MakeTransactionRequest>) {
    Object.assign(this, partial);
  }
}

export class setAgentPercentageRequest {
  @ApiProperty()
  @IsNumber()
  @Max(100)
  @Min(0)
  percentage: number;
}
