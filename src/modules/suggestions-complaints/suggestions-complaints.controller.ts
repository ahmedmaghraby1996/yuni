import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { TicketStatus } from 'src/infrastructure/data/enums/ticket-status.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { AdminPermission } from '../authentication/guards/admin-permission.decorator';
import { SupportTicketService } from '../support-ticket/support-ticket.service';
import { TicketResponse } from '../support-ticket/dto/ticket.response';
import { SuggestionsComplaintsRequest } from './dto/suggestions-complaints.request';

@ApiTags('Suggestions-complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('suggestions-complaints')
export class SuggestionsComplaintsController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Roles(Role.CLIENT, Role.STORE)
  @Post()
  async createSuggestionsComplaints(@Body() req: SuggestionsComplaintsRequest) {
    const ticket = await this.supportTicketService.createTicket({
      title: req.title,
      description: req.description,
    });
    return new ActionResponse(plainToInstance(TicketResponse, ticket, { excludeExtraneousValues: true }));
  }

  @Roles(Role.CLIENT, Role.STORE)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @Get()
  async getMySuggestionsComplaints(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: TicketStatus,
  ) {
    const { data, total } = await this.supportTicketService.getMyTickets(Number(page), Number(limit), status);
    const result = plainToInstance(TicketResponse, data, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @Roles(Role.CLIENT, Role.STORE)
  @Get(':id')
  async getSingleSuggestionsComplaints(@Param('id') id: string) {
    const ticket = await this.supportTicketService.getTicketById(id);
    return new ActionResponse(plainToInstance(TicketResponse, ticket, { excludeExtraneousValues: true }));
  }

  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @AdminPermission('support_tickets', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'name', required: false, type: String })
  @Get('admin/all')
  async getAllSuggestionsComplaints(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: TicketStatus,
    @Query('name') name?: string,
  ) {
    const { data, total } = await this.supportTicketService.getAllTickets(Number(page), Number(limit), status, name);
    const result = plainToInstance(TicketResponse, data, { excludeExtraneousValues: true });
    return new PaginatedResponse(result, { meta: { total, page: Number(page), limit: Number(limit) } });
  }
}
