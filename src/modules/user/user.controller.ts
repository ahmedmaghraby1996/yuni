import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { StoreEndpoint } from 'src/core/decorators/store-endpoint.decorator';
import { StoreOfferUserResponse } from '../offers/dto/responses/store-offer-user.response';
import { UserService } from './user.service';
import { UpdateFcmRequest } from './dto/update-fcm.request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { applyQueryFilters, applyQueryIncludes } from 'src/core/helpers/service-related.helper';
import { plainToInstance } from 'class-transformer';
import { AcceptAgentRequest, AgentResponse, UserResponse } from './dto/response/user-response';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { GetUserRequest } from './dto/get-user.request';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { RegisterResponse } from '../authentication/dto/responses/register.response';
import { UpdateProfileRequest } from './dto/update-profile-request';
import { PaymentResponseInterface } from './dto/response/payment.response';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { UpdateStoreInfoRequest } from './dto/request/update-store-info.request';

@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(REQUEST) private request: Request,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
  ) {}

  @StoreEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @ApiOperation({ summary: 'Get users who used store codes with usage count per user' })
  @Get('code-users')
  async getCodeUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    const { results, total } = await this.userService.getStoreOfferUsers(Number(page), Number(limit));
    const data = plainToInstance(StoreOfferUserResponse, results, { excludeExtraneousValues: true });
    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('')
  async getAll(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'city');
    const users = await this.userService.findAll(query);
    const usersResponse = await Promise.all(
      users.map(async (user) => {
        return this._i18nResponse.entity(
          plainToInstance(UserResponse, {
            id: user.id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            phone: user.phone,
            avatar: user.avatar,
            is_active: user.is_active,
            role: user.roles[0],
            created_at: user.created_at,
          }),
        );
      }),
    );
    const total = await this.userService.count(query);
    return new PaginatedResponse(usersResponse, { meta: { total, ...query } });
  }

  @Get('/agents')
  async getAllAgents(
    @Query() query: PaginatedRequest,
    @Query('is_active') is_active: boolean,
  ) {
    applyQueryIncludes(query, 'wallet');
    applyQueryIncludes(query, 'city');
    applyQueryFilters(query, `roles=${Role.AGENT}`);
    if (is_active == true) {
      applyQueryFilters(query, `code== `);
    } else if (is_active == false) {
      applyQueryFilters(query, `code=! `);
    }
    const count = await this.userService.count(query);
    const users = await this.userService.findAll(query);
    const usersResponse = plainToInstance(AgentResponse, users, {
      excludeExtraneousValues: true,
    });
    return new PaginatedResponse(usersResponse, {
      meta: { total: count, ...query },
    });
  }

  @Get('/agent/:id')
  async getAgentById(@Param('id') id: string) {
    const user = await this.userService._repo.findOne({
      where: { id: id },
      relations: { city: true, wallet: true, merchants: true },
    });
    return new ActionResponse(
      plainToInstance(AgentResponse, user, { excludeExtraneousValues: true }),
    );
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('activate-agent/:id')
  async activateAgent(
    @Param('id') id: string,
    @Body() req: AcceptAgentRequest,
  ) {
    const agent = await this.userService.activateAgent(id, req.code);
    return new ActionResponse(agent);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('reject-agent/:id')
  async rejectAgent(@Param('id') id: string) {
    const agent = await this.userService.rejectAgent(id);
    return new ActionResponse(agent);
  }

  @Post('confirm/payment')
  async handleWebhook(@Body() body: any) {
    console.log(this.request.headers);
    const paymentResponse = Object.assign(new PaymentResponseInterface(), body);
    return this.userService.confirmPayment(paymentResponse);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  async getProile() {
    const user = await this.userService._repo.findOne({
      where: { id: this.request.user.id },
      relations: {
        city: true,
        subscriptions: true,
        favorite_sections: true,
      },
      order: { subscriptions: { created_at: 'DESC' } },
    });

    const userResponse = plainToInstance(UserResponse, user, {
      excludeExtraneousValues: true,
    });

    let completedFields = 0;
    const totalFields = 11;
    if (user.name) completedFields++;
    if (user.email) completedFields++;
    if (user.phone) completedFields++;
    if (user.city_id || user.city) completedFields++;
    if (user.avatar) completedFields++;
    if (user.gender) completedFields++;
    if (user.birth_date) completedFields++;
    if (user.school_name) completedFields++;
    if (user.major) completedFields++;
    if (user.language) completedFields++;
    if (user.favorite_sections && user.favorite_sections.length > 0) completedFields++;

    userResponse.profile_completion_percentage = Math.round(
      (completedFields / totalFields) * 100,
    );

    return new ActionResponse(this._i18nResponse.entity(userResponse));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('/fcm-token')
  async updateFcmToken(@Body() req: UpdateFcmRequest) {
    const user = await this.userService.findOne(this.request.user.id);
    user.fcm_token = req.fcm_token;
    await this.userService.update(user);
    return new ActionResponse(
      await this.userService.findOne(this.request.user.id),
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @Put('update-profile')
  async updateProfile(
    @Body() request: UpdateProfileRequest,
    @UploadedFile(new UploadValidator().build())
    avatarFile: Express.Multer.File,
  ) {
    if (avatarFile) {
      request.avatarFile = avatarFile;
    }
    return new ActionResponse(
      plainToInstance(
        RegisterResponse,
        await this.userService.updateProfile(this.request.user.id, request),
        { excludeExtraneousValues: true },
      ),
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/delete')
  async deleteUser(@Query() query: GetUserRequest) {
    return new ActionResponse(
      await this.userService.deleteUser(query.id ?? this.request.user.id),
    );
  }

  @UseInterceptors(
    ClassSerializerInterceptor,
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'catalogue', maxCount: 1 },
    ]),
  )
  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @Roles(Role.ADMIN)
  @Put('store-info/:id')
  async AdminupdateStoreInfo(
    @Param('id') id: string,
    @Body() req: UpdateStoreInfoRequest,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      catalogue?: Express.Multer.File[];
    },
  ) {
    if (files?.logo && files?.logo?.length > 0) {
      req.logo = files.logo[0];
    }
    if (files?.catalogue && files.catalogue?.length > 0) {
      req.catalogue = files.catalogue[0];
    }
    req.id = id;
    const storeInfo = await this.userService.updateMainStoreInfo(req);
    return new ActionResponse(storeInfo);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('approve-store/:id')
  async adminApproveStore(@Param('id') id: string) {
    return this.userService.adminAcceptStore(id);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('reject-store/:id')
  async adminRejectStore(@Param('id') id: string) {
    return this.userService.adminRejectStore(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService._repo.findOne({
      where: { id: id },
      relations: { city: true, subscriptions: true },
    });
    return new ActionResponse(
      this._i18nResponse.entity(
        plainToInstance(
          UserResponse,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            phone: user.phone,
            avatar: user.avatar,
            role: user.roles[0],
            created_at: user.created_at,
            subscriptions: user.subscriptions,
            city: user.city,
          },
          { excludeExtraneousValues: true },
        ),
      ),
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('test/payment')
  async testPayment() {
    const amount = '10.00';
    return await this.userService.makePayment(amount);
  }
}
