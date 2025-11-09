import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SuggestionsComplaintsService } from './suggestions-complaints.service';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { SuggestionsComplaints } from 'src/infrastructure/entities/suggestions-complaints/suggestions-complaints.entity';
import { SuggestionsComplaintsRequest } from './dto/suggestions-complaints.request';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { query } from 'express';
import { SuggestionsComplaintResponse } from './dto/suggestions-complaints-response';
import { plainToClass, plainToInstance } from 'class-transformer';
import { applyQueryIncludes } from 'src/core/helpers/service-related.helper';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';

@ApiTags('Suggestions-complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, )
@ApiBearerAuth()
@Controller('suggestions-complaints')
export class SuggestionsComplaintsController {
  constructor(
    private readonly suggestionsComplaintsService: SuggestionsComplaintsService,
  ) {}

  @Get()
  async getAllSuggestionsComplaints(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, "user");
    const result = await this.suggestionsComplaintsService.findAll(query);
    const count= await this.suggestionsComplaintsService.count(query)
    return new PaginatedResponse<SuggestionsComplaintResponse[]>(
      plainToInstance(SuggestionsComplaintResponse, result, {
        excludeExtraneousValues: true,
      }),{meta:{...query,total:count}}
    );
  }

  @Get("/:id")
  async getSingleSuggestionsComplaints(@Param("id") id: string) {
    
    const result = await this.suggestionsComplaintsService.getSingleSuggestionsComplaint(id);
    return new ActionResponse<SuggestionsComplaintResponse>(
      plainToInstance(SuggestionsComplaintResponse, result, {
        excludeExtraneousValues: true,
      }),
    );
  }
  @Roles(Role.CLIENT, Role.STORE)
  @Post()
  async createSuggestionsComplaints(
    @Body() suggestionsComplaintsRequest: SuggestionsComplaintsRequest,
  ) {
    const result =
      await this.suggestionsComplaintsService.createSuggestionsComplaints(
        suggestionsComplaintsRequest,
      );
    return new ActionResponse<SuggestionsComplaintsRequest>(
      suggestionsComplaintsRequest,
    );
  }
}
