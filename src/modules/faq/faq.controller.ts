import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FaqQuestion } from 'src/infrastructure/entities/faq/faq_question';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { AdminPermission } from '../authentication/guards/admin-permission.decorator';
import { CreateFaqRequest, UpdateFaqRequest } from './dto/create-faq.request';
import { plainToInstance } from 'class-transformer';
import { Like } from 'typeorm';

@Controller('faq')
@ApiTags('Faq')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
export class FaqController {
  constructor(
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    private readonly serivce: FaqService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  @Get()
  async getQuestion() {
    const res = await this.serivce.getQuestion();
    return new ActionResponse(res);
  }

  @AdminEndpoint()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('static_pages', 'view')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by title (ar or en)' })
  @Get('admin/all')
  async getAdminQuestions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
  ) {
    const where = name ? [{ title_ar: Like(`%${name}%`) }, { title_en: Like(`%${name}%`) }] : {};
    const [data, total] = await this.serivce.faq_question_repo.findAndCount({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @AdminEndpoint()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('static_pages', 'view')
  @Get('admin/:id')
  async getAdminQuestionById(@Param('id') id: string) {
    const res = await this.serivce.faq_question_repo.findOneBy({ id });
    return new ActionResponse(res);
  }

  @AdminEndpoint()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('static_pages', 'add')
  @Post('admin')
  async createQuestion(@Body() req: CreateFaqRequest) {
    const res = await this.serivce.create(plainToInstance(FaqQuestion, req));
    return new ActionResponse(res);
  }

  @AdminEndpoint()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('static_pages', 'edit')
  @Put('admin/:id')
  async updateQuestion(@Param('id') id: string, @Body() req: UpdateFaqRequest) {
    const res = await this.serivce.update(plainToInstance(FaqQuestion, { ...req, id }));
    return new ActionResponse(res);
  }

  @AdminEndpoint()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AdminPermission('static_pages', 'delete')
  @Delete('admin/:id')
  async deleteQuestion(@Param('id') id: string) {
    const res = await this.serivce.delete(id);
    return new ActionResponse(res);
  }
}
