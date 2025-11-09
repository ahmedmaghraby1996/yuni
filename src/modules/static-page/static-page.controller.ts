import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
import { UpdateStaticPageRequest } from './dto/request/update-static-page.request';
import { StaticPageService } from './static-page.service';
import { StaticPagesEnum } from 'src/infrastructure/data/enums/static-pages.enum';
import { GetStaticPage } from './dto/request/get-static-page.request';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { StaticPage } from 'src/infrastructure/entities/static-pages/static-pages.entity';
import { plainToInstance } from 'class-transformer';
import { StaticPageResponse } from './dto/response/static-page.response';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
// @Roles(Role.ADMIN, Role.PARENT, Role.SECURITY, Role.School, Role.DRIVER)
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@ApiTags('Satic Page')
@Controller('static-page')
export class StaticPageController {
  constructor(
    private readonly staticPageService: StaticPageService,
    private readonly _i18nResponse: I18nResponse,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStaticPage(
    @Body() req: UpdateStaticPageRequest,
  ): Promise<ActionResponse<StaticPage>> {
    const result = await this.staticPageService.updateStaticPageByType(req);
    return new ActionResponse<StaticPage>(result);
  }

  @Get('/:static_page_type')
  async getStaticPage(
    @Param() param: GetStaticPage,
  ): Promise<ActionResponse<StaticPageResponse>> {
    let staticPage = await this.staticPageService.getStaticPageByType(
      param.static_page_type,
    );
    const admin_data =  await this.staticPageService.getStaticPageByType(
        param.static_page_type,
      );
    staticPage = this._i18nResponse.entity(staticPage);
console.log(admin_data);
    const result = plainToInstance(
      StaticPageResponse,
      {
        ...staticPage,
        content_ar: admin_data.content_ar,
        content_en: admin_data.content_en,
      },
      {
        excludeExtraneousValues: true,
      },
    );
    return new ActionResponse<StaticPageResponse>(result);
  }
}
