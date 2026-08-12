import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { TicketStatus } from 'src/infrastructure/data/enums/ticket-status.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Permission } from '../authentication/guards/permission.decorator';
import { AdminPermission } from '../authentication/guards/admin-permission.decorator';
import { CreateTicketRequest } from './dto/create-ticket.request';
import { ReplyTicketRequest } from './dto/reply-ticket.request';
import { TicketResponse } from './dto/ticket.response';
import { SupportTicketService } from './support-ticket.service';

@ApiTags('Support Tickets')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@Controller('support-ticket')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  // ─── Store ─────────────────────────────────────────────────────────────────

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('support', 'add')
  @ApiOperation({ summary: 'Create a support ticket' })
  @Post()
  async createTicket(@Body() req: CreateTicketRequest) {
    const ticket = await this.supportTicketService.createTicket(req);
    return new ActionResponse(plainToInstance(TicketResponse, ticket, { excludeExtraneousValues: true }));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('support', 'view')
  @ApiOperation({ summary: 'Get my support tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by user name' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'End date (ISO 8601)' })
  @Get()
  async getMyTickets(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: TicketStatus,
    @Query('name') name?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { data, total } = await this.supportTicketService.getMyTickets(Number(page), Number(limit), status, name, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    const result = plainToInstance(TicketResponse, data, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('support', 'view')
  @ApiOperation({ summary: 'Get support ticket by id' })
  @Get(':id')
  async getTicketById(@Param('id') id: string) {
    const ticket = await this.supportTicketService.getTicketById(id);
    return new ActionResponse(plainToInstance(TicketResponse, ticket, { excludeExtraneousValues: true }));
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('support_tickets', 'view')
  @ApiOperation({ summary: 'Get all support tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by user name' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'End date (ISO 8601)' })
  @Get('admin/all')
  async getAllTickets(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: TicketStatus,
    @Query('name') name?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { data, total } = await this.supportTicketService.getAllTickets(Number(page), Number(limit), status, name, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    const result = plainToInstance(TicketResponse, data, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('support_tickets', 'view')
  @ApiOperation({ summary: 'Get support ticket by id (admin)' })
  @Get('admin/:id')
  async getAdminTicketById(@Param('id') id: string) {
    const ticket = await this.supportTicketService.getAdminTicketById(id);
    return new ActionResponse(plainToInstance(TicketResponse, ticket, { excludeExtraneousValues: true }));
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('support_tickets', 'edit')
  @ApiOperation({ summary: 'Reply to a support ticket — sets status to replied' })
  @Put(':id/reply')
  async replyTicket(@Param('id') id: string, @Body() req: ReplyTicketRequest) {
    const ticket = await this.supportTicketService.replyTicket(id, req);
    return new ActionResponse(plainToInstance(TicketResponse, ticket, { excludeExtraneousValues: true }));
  }
}
