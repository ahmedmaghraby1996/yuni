import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { ActionResponse } from 'src/core/base/responses/action.response';
import {
  applyQueryFilters,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { ApiQuery, ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { plainToInstance } from 'class-transformer';
import { TransactionResponse } from './dto/response/transaction-response';
import {
  MakeTransactionRequest,
  WalletChargeRequest,
  WalletRefundRequest,
  setAgentPercentageRequest,
} from './dto/requests/make-transaction-request';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
import { Permission } from '../authentication/guards/permission.decorator';

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

  @StoreEndpoint()
  @Roles(Role.STORE, Role.ADMIN, Role.CLIENT)
  @Permission('packages', 'view')
  @ApiQuery({ name: 'number', required: false, type: String, description: 'Filter by transaction number' })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter to date (YYYY-MM-DD)' })
  @Get()
  async getTransactions(
    @Query() query: PaginatedRequest,
    @Query('number') number?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    applyQuerySort(query, 'created_at=desc');
    if (!this.transactionService.currentUser.roles.includes(Role.ADMIN))
      applyQueryFilters(query, `user_id=${this.transactionService.currentUser.id}`);
    if (number) applyQueryFilters(query, `number=${number}`);
    if (date_from) applyQueryFilters(query, `created_at>=${date_from}`);
    if (date_to) applyQueryFilters(query, `created_at<=${date_to}`);

    const total = await this.transactionService.count(query);
    const transactions = await this.transactionService.findAll(query);
    const result = plainToInstance(TransactionResponse, transactions, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @StoreEndpoint()
  @Roles(Role.STORE, Role.ADMIN, Role.CLIENT)
  @Permission('packages', 'view')
  @Get('wallet')
  async getWallet() {
    return new ActionResponse(await this.transactionService.getWallet());
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('packages', 'edit')
  @Post('charge')
  async chargeWallet(@Body() req: WalletChargeRequest) {
    return new ActionResponse(
      plainToInstance(TransactionResponse, await this.transactionService.chargeWallet(req), { excludeExtraneousValues: true }),
    );
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('packages', 'edit')
  @Post('refund')
  async refundWallet(@Body() req: WalletRefundRequest) {
    return new ActionResponse(
      plainToInstance(TransactionResponse, await this.transactionService.refundWallet(req), { excludeExtraneousValues: true }),
    );
  }

  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @Post()
  async makeTransaction(@Body() request: MakeTransactionRequest) {
    return new ActionResponse(
      await this.transactionService.makeTransaction(request),
    );
  }

  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @Post('set-agent-percentage')
  async set(@Body() request: setAgentPercentageRequest) {
    return new ActionResponse(
      await this.transactionService.setAgentPercentage(request.percentage),
    );
  }

  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @Get('earnings')
  async getEarnings() {
    return new ActionResponse(await this.transactionService.getEarnings());
  }
}
