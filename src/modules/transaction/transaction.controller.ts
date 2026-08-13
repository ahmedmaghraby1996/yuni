import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { ActionResponse } from 'src/core/base/responses/action.response';
import {
  applyQueryFilters,
  applyQueryIncludes,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { ApiQuery, ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { AdminPermission } from '../authentication/guards/admin-permission.decorator';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { plainToInstance } from 'class-transformer';
import { TransactionResponse } from './dto/response/transaction-response';
import { WalletResponse } from './dto/response/wallet-response';
import {
  MakeTransactionRequest,
  WalletChargeRequest,
  WalletRefundRequest,
  setAgentPercentageRequest,
} from './dto/requests/make-transaction-request';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
import { Permission } from '../authentication/guards/permission.decorator';
import { TransactionTypes } from 'src/infrastructure/data/enums/transaction-types';
import { TransactionStatus } from 'src/infrastructure/data/enums/transaction-status.enum';

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
  @Permission('wallet', 'view')
  @ApiQuery({ name: 'number', required: false, type: String, description: 'Filter by transaction number' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionTypes, description: 'Filter by transaction type' })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter to date (YYYY-MM-DD)' })
  @Get()
  async getTransactions(
    @Query() query: PaginatedRequest,
    @Query('number') number?: string,
    @Query('type') type?: TransactionTypes,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    applyQuerySort(query, 'created_at=desc');
    if (!this.transactionService.currentUser.roles.includes(Role.ADMIN))
      applyQueryFilters(query, `user_id=${this.transactionService.currentUser.id}`);
    if (number) applyQueryFilters(query, `number=${number}`);
    if (type) applyQueryFilters(query, `type=${type}`);
    if (date_from) applyQueryFilters(query, `created_at>=${date_from}`);
    if (date_to) applyQueryFilters(query, `created_at<=${date_to}`);

    const total = await this.transactionService.count(query);
    const transactions = await this.transactionService.findAll(query);
    const result = plainToInstance(TransactionResponse, transactions, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: query.page, limit: query.limit } });
  }

  @StoreEndpoint()
  @Roles(Role.STORE, Role.ADMIN, Role.CLIENT)
  @Permission('wallet', 'view')
  @Get('wallet')
  async getWallet() {
    return new ActionResponse(await this.transactionService.getWallet());
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('wallet', 'add')
  @Post('charge')
  async chargeWallet(@Body() req: WalletChargeRequest) {
    return new ActionResponse(
      plainToInstance(TransactionResponse, await this.transactionService.chargeWallet(req), { excludeExtraneousValues: true }),
    );
  }

  @StoreEndpoint()
  @Roles(Role.STORE)
  @Permission('wallet', 'edit')
  @Post('refund')
  async refundWallet(@Body() req: WalletRefundRequest) {
    return new ActionResponse(
      plainToInstance(TransactionResponse, await this.transactionService.refundWallet(req), { excludeExtraneousValues: true }),
    );
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  @ApiTags('Admin Transactions')
  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @AdminPermission('transactions', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by user name' })
  @ApiQuery({ name: 'user_id', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'number', required: false, type: String, description: 'Filter by transaction number' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionTypes, description: 'Filter by type' })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'From date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'To date (YYYY-MM-DD)' })
  @Get('admin/all')
  async getAdminTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('user_id') user_id?: string,
    @Query('number') number?: string,
    @Query('type') type?: TransactionTypes,
    @Query('status') status?: TransactionStatus,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    const { data, total } = await this.transactionService.getAdminTransactions(
      Number(page), Number(limit), { name, user_id, number, type, status, date_from, date_to },
    );
    const result = plainToInstance(TransactionResponse, data, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @ApiTags('Admin Transactions')
  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @AdminPermission('transactions', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('admin/wallets/:user_id')
  async getStoreWallet(
    @Param('user_id') user_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return new ActionResponse(await this.transactionService.getStoreWallet(user_id, +page, +limit));
  }

  @ApiTags('Admin Transactions')
  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @AdminPermission('transactions', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by store name' })
  @Get('admin/wallets')
  async getAdminWallets(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
  ) {
    const { data, total } = await this.transactionService.getAdminWallets(+page, +limit, name);
    return new PaginatedResponse(
      plainToInstance(WalletResponse, data, { excludeExtraneousValues: true }),
      { meta: { total, page: +page, limit: +limit } },
    );
  }

  @ApiTags('Admin Transactions')
  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @AdminPermission('transactions', 'add')
  @Post('admin')
  async makeTransaction(@Body() request: MakeTransactionRequest) {
    return new ActionResponse(
      await this.transactionService.makeTransaction(request),
    );
  }

  @ApiTags('Admin Transactions')
  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @AdminPermission('transactions', 'edit')
  @Patch('admin/:id/accept-refund')
  async acceptRefund(@Param('id') id: string) {
    return new ActionResponse(
      plainToInstance(TransactionResponse, await this.transactionService.acceptRefund(id), { excludeExtraneousValues: true }),
    );
  }

  @ApiTags('Admin Transactions')
  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @AdminPermission('transactions', 'edit')
  @Patch('admin/:id/reject-refund')
  async rejectRefund(@Param('id') id: string) {
    return new ActionResponse(
      plainToInstance(TransactionResponse, await this.transactionService.rejectRefund(id), { excludeExtraneousValues: true }),
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
