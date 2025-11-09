import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { Repository } from 'typeorm';
import { MakeTransactionRequest } from './dto/requests/make-transaction-request';
import { plainToInstance } from 'class-transformer';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { SystemVariable } from 'src/infrastructure/entities/system-variables/system-variable.entity';
import { SystemVariableEnum } from 'src/infrastructure/data/enums/sysytem-variable.enum';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';

@Injectable()
export class TransactionService extends BaseUserService<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @Inject(REQUEST) request: Request,
    @InjectRepository(SystemVariable)
    private readonly systemVariableRepo: Repository<SystemVariable>,
  ) {
    super(transactionRepository, request);
  }

  async makeTransaction(req: MakeTransactionRequest) {
    let user_wallet = await this.walletRepository.findOneBy({
      user_id: req.user_id,
    });

    if (!user_wallet) {
      user_wallet = await this.walletRepository.save(
        new Wallet({ user_id: req.user_id, balance: 0 }),
      );
    }
    req.amount = Number(req.amount);

    user_wallet.balance = Number(user_wallet.balance) + req.amount;
    user_wallet.balance = Number(user_wallet.balance);

    const transaction = plainToInstance(Transaction, {
      ...req,
    });
if (req.date || req.iban || req.bank) {
  transaction.meta_data = JSON.stringify({
    date: req.date,
    iban: req.iban,
    bank: req.bank,
  });
}

    await this.transactionRepository.save(transaction);

    await this.walletRepository.save(user_wallet);
    if(req.type==TransactionTypes.AGENT_PAYMENT){
      const system_variables = await this.systemVariableRepo.find({});
      await this.systemVariableRepo.update(
        {
          key: SystemVariableEnum.REMANDING_AGENT_DUES,
        },
        {
          value:
            system_variables.find(
              (item) => item.key == SystemVariableEnum.REMANDING_AGENT_DUES,
            ).value + req.amount,
        },
      );
    }
    return transaction;
  }
  async checkBalance(user_id: string, amount: number) {
    const wallet = await this.walletRepository.findOneBy({
      user_id: user_id,
    });
    if (Number(wallet.balance) < Number(amount)) {
      return false;
    }
    return true;
  }

  async getWallet() {
    const wallet = await this.walletRepository.findOneBy({
      user_id: this.currentUser.id,
    });
    return wallet;
  }


  async setAgentPercentage(percentage: number) {
    
    return await this.systemVariableRepo.update(
      {
        key: SystemVariableEnum.AGENT_PERCENTAGE,
      },
      {
        value: percentage,
      },
    );
    
  }
  async getEarnings() {
    const system_variables = await this.systemVariableRepo.find({});
    return {
      total_earnings: system_variables.find(
        (item) => item.key == SystemVariableEnum.TOTAL_EARNINGS,
      ).value,
      agent_percentage: system_variables.find(
        (item) => item.key == SystemVariableEnum.AGENT_PERCENTAGE,
      ).value,
      agent_dues: system_variables.find(
        (item) => item.key == SystemVariableEnum.AGENT_DUES,
      ).value,
      remanding_agent_dues: system_variables.find(
        (item) => item.key == SystemVariableEnum.REMANDING_AGENT_DUES,
      ).value,
    
      
    };

      
  }
}
