import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { ActionResponse } from 'src/core/base/responses/action.response';
import {
  applyQueryFilters,
  applyQueryIncludes,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { plainToInstance } from 'class-transformer';
import { TransactionResponse } from './dto/response/transaction-response';
import { MakeTransactionRequest, setAgentPercentageRequest } from './dto/requests/make-transaction-request';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';

@ApiTags('Transaction')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getTransactions(@Query() query: PaginatedRequest) {
    applyQuerySort(query, 'created_at=desc');
    applyQueryIncludes(query, 'user');
    if (!this.transactionService.currentUser.roles.includes(Role.ADMIN))
      applyQueryFilters(
        query,
        `user_id=${this.transactionService.currentUser.id}`,
      );
    const transaction = await this.transactionService.findAll(query);

    if (query.page && query.limit) {
      const total = await this.transactionService.count(query);
      return new PaginatedResponse(transaction, { meta: { total, ...query } });
    } else {
      return new ActionResponse(plainToInstance(TransactionResponse, transaction, { excludeExtraneousValues: true }));
    }
  }

  @Get('wallet')
  async getWallet() {
    return new ActionResponse(await this.transactionService.getWallet());
  }

  @Roles(Role.ADMIN)
  @Post()
  async makeTransaction(@Body() request: MakeTransactionRequest) {
    return new ActionResponse(
      await this.transactionService.makeTransaction(request),
    );
  }

  @Roles(Role.ADMIN)
  @Post('set-agent-percentage')
  async set(@Body() request: setAgentPercentageRequest) {
    return new ActionResponse(
      await this.transactionService.setAgentPercentage(request.percentage),
    );
  }

  @Roles(Role.ADMIN)
  @Get('earnings')
  async getEarnings() {
    return new ActionResponse(await this.transactionService.getEarnings());
  }
}
