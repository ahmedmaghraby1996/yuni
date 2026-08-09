import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { Repository } from 'typeorm';
import { MakeTransactionRequest, WalletChargeRequest, WalletRefundRequest } from './dto/requests/make-transaction-request';
import { plainToInstance } from 'class-transformer';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { SystemVariable } from 'src/infrastructure/entities/system-variables/system-variable.entity';
import { SystemVariableEnum } from 'src/infrastructure/data/enums/sysytem-variable.enum';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';
import { TransactionStatus } from 'src/infrastructure/data/enums/transaction-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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

  async getAdminWallets(page = 1, limit = 10, search?: string) {
    const qb = this.walletRepository
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.user', 'user')
      .innerJoin('user.stores', 'store', 'store.is_main_branch = true')
      .addSelect(['store.id', 'store.name', 'store.logo'])
      .where('user.roles LIKE :role', { role: '%STORE%' })
      .orderBy('w.balance', 'DESC');

    if (search) qb.andWhere('(user.name LIKE :s OR user.email LIKE :s OR user.phone LIKE :s)', { s: `%${search}%` });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
  }

  async chargeWallet(req: WalletChargeRequest) {
    return this.makeTransaction(
      new MakeTransactionRequest({
        user_id: this.currentUser.id,
        amount: Number(req.amount),
        type: TransactionTypes.WALLET_CHARGE,
      }),
    );
  }

  async refundWallet(req: WalletRefundRequest) {
    const transaction = new Transaction({
      user_id: this.currentUser.id,
      amount: -Math.abs(Number(req.amount)),
      type: TransactionTypes.WALLET_REFUND,
      status: TransactionStatus.PENDING,
      meta_data: JSON.stringify({ reason: req.reason }),
    });
    return this.transactionRepository.save(transaction);
  }

  async acceptRefund(id: string) {
    const transaction = await this.transactionRepository.findOneBy({ id });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.type !== TransactionTypes.WALLET_REFUND)
      throw new BadRequestException('Not a refund transaction');
    if (transaction.status !== TransactionStatus.PENDING)
      throw new BadRequestException('Transaction is not pending');

    let wallet = await this.walletRepository.findOneBy({ user_id: transaction.user_id });
    if (!wallet) wallet = await this.walletRepository.save(new Wallet({ user_id: transaction.user_id, balance: 0 }));

    wallet.balance = Number(wallet.balance) + Number(transaction.amount);
    await this.walletRepository.save(wallet);

    transaction.status = TransactionStatus.COMPLETED;
    return this.transactionRepository.save(transaction);
  }

  async rejectRefund(id: string) {
    const transaction = await this.transactionRepository.findOneBy({ id });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.type !== TransactionTypes.WALLET_REFUND)
      throw new BadRequestException('Not a refund transaction');
    if (transaction.status !== TransactionStatus.PENDING)
      throw new BadRequestException('Transaction is not pending');

    transaction.status = TransactionStatus.FAILED;
    return this.transactionRepository.save(transaction);
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
