//create notification controller
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { Permission } from 'src/modules/authentication/guards/permission.decorator';
import { plainToInstance } from 'class-transformer';

import { NotificationResponse } from '../dto/notification.response';
import { ToggleRequest } from '../dto/toggle.request';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from 'src/modules/authentication/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/authentication/guards/roles.guard';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from 'src/modules/authentication/guards/roles.decorator';

class StoreNotificationRequest {
  @ApiProperty() @IsNotEmpty() @IsString() title_ar: string;
  @ApiProperty() @IsNotEmpty() @IsString() title_en: string;
  @ApiProperty() @IsNotEmpty() @IsString() message_ar: string;
  @ApiProperty() @IsNotEmpty() @IsString() message_en: string;
  @ApiProperty({ required: false, type: [String], description: 'Optional: specific user IDs to notify. If omitted, sends to all store customers.' })
  @IsOptional() @IsArray() user_ids?: string[];
}
import { ActionResponse } from 'src/core/base/responses/action.response';
import { SendToAllUsersNotificationRequest, SendToUsersNotificationRequest } from '../dto/requests/send-to-users-notification.request';
import { applyQueryFilters, applyQuerySort } from 'src/core/helpers/service-related.helper';

@ApiBearerAuth()
@ApiTags('Notifications')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    private readonly notificationService: NotificationService,
  ) {}

  



  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)



  async findAll(@Query() query: PaginatedRequest) {
    applyQuerySort(query, `created_at=desc`);
    applyQueryFilters(query, `user_id=${this.notificationService.currentUser.id}`);
    let result = await this.notificationService.findAll(query);
    result = this._i18nResponse.entity(result,this.notificationService.currentUser.roles);
    const response = plainToInstance(NotificationResponse, result, {
      excludeExtraneousValues: true,
    });
    if (query.page && query.limit) {
      const total = await this.notificationService.count(query);
      return new PaginatedResponse<NotificationResponse[]>(response, {
        meta: { total, ...query },
      });
    } else {
      return new ActionResponse<NotificationResponse[]>(response);
    }
  }

  @AdminEndpoint()
  @Get("/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN,)
  async getSingleNotification(@Param("id") id: string) {
    const result= await this.notificationService.getSingleNotification(id);
return new ActionResponse<NotificationResponse>(
  plainToInstance(NotificationResponse, {...result.notification,users:result?.users}, {
    excludeExtraneousValues: true,
  }),
)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN,Role.CLIENT,)
  markAs(@Body() req: ToggleRequest, @Param('id') id: string) {
    let result = this.notificationService.toggleRead(req.isRead, id);
    result = this._i18nResponse.entity(result);
    const response = plainToInstance(NotificationResponse, result, {
      excludeExtraneousValues: true,
    });
    return new ActionResponse<NotificationResponse>(response);
  }

  @AdminEndpoint()
  @Roles(Role.ADMIN,)
  @Post('send-to-users')
  async sendToUsers(
    @Body() sendToUsersNotificationRequest: SendToUsersNotificationRequest,
  ) {
    await this.notificationService.sendToUsers(sendToUsersNotificationRequest);
  }
  @AdminEndpoint()
  @Post('send-to-all')
  async sendToAll(
    @Body() sendToUsersNotificationRequest: SendToAllUsersNotificationRequest,
  ) {
    return new ActionResponse(await this.notificationService.sendToALl(sendToUsersNotificationRequest));
  }

  // ─── Store Notifications ───────────────────────────────────────────────────

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('customers', 'view')
  @Get('store')
  async getStoreNotifications(@Query() query: PaginatedRequest) {
    const data = await this.notificationService.getStoreNotifications(query);
    const response = plainToInstance(NotificationResponse, data, { excludeExtraneousValues: true });
    return new ActionResponse(response);
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('customers', 'view')
  @Get('store/:id')
  async getStoreNotificationById(@Param('id') id: string) {
    const result = await this.notificationService.getStoreNotificationById(id);
    return new ActionResponse(plainToInstance(NotificationResponse, result, { excludeExtraneousValues: true }));
  }

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Permission('customers', 'view')
  @Post('store/send')
  async sendToStoreCustomers(@Body() req: StoreNotificationRequest) {
    return new ActionResponse(await this.notificationService.sendToStoreCustomers(req));
  }
}
