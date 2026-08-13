import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import { Permission } from '../authentication/guards/permission.decorator';
import { GetUserRequest } from './dto/get-user.request';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { RegisterResponse } from '../authentication/dto/responses/register.response';
import { UpdateProfileRequest } from './dto/update-profile-request';
import { PaymentResponseInterface } from './dto/response/payment.response';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { UpdateStoreInfoRequest } from './dto/request/update-store-info.request';

export class ChangeUserStatusRequest {
  @ApiProperty({ enum: ['active', 'deactivated', 'pending'] })
  @IsEnum(['active', 'deactivated', 'pending'])
  status: 'active' | 'deactivated' | 'pending';
}

export class AdminUpdateUserRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}

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
  @Permission('customers', 'view')
  @ApiOperation({ summary: 'Get users who used store codes with usage count per user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by user name' })
  @Get('code-users')
  async getCodeUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
  ) {
    const { results, total } = await this.userService.getStoreOfferUsers(Number(page), Number(limit), name);
    const data = plainToInstance(StoreOfferUserResponse, results, { excludeExtraneousValues: true });
    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: ['store', 'customer'], description: 'Filter by role: store owner or customer' })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'deactivated', 'pending'] })
  @Get('')
  async getAll(
    @Query() query: PaginatedRequest,
    @Query('role') role?: 'store' | 'customer',
    @Query('name') name?: string,
    @Query('phone') phone?: string,
    @Query('status') status?: string,
  ) {
    applyQueryIncludes(query, 'city');
    if (!query.sortBy) query.sortBy = ['created_at=DESC'];
    if (role === 'store') applyQueryFilters(query, `roles=${Role.STORE}`);
    else if (role === 'customer') applyQueryFilters(query, `roles=${Role.CLIENT}`);
    if (name) applyQueryFilters(query, `name=${name}`);
    if (phone) applyQueryFilters(query, `phone=${phone}`);
    if (status) applyQueryFilters(query, `status=${status}`);
    const [users, total] = await Promise.all([
      this.userService.findAll(query),
      this.userService.count(query),
    ]);
    const usersResponse = users.map((user) =>
      this._i18nResponse.entity(
        plainToInstance(UserResponse, {
          id: user.id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          phone: user.phone,
          avatar: user.avatar,
          status: user.status,
          role: user.roles[0],
          created_at: user.created_at,
          city: user.city,
        }),
      ),
    );
    return new PaginatedResponse(usersResponse, { meta: { total, page: query.page, limit: query.limit } });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
      meta: { total: count, page: query.page, limit: query.limit },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
        subscriptions: { package: true },
        favorite_sections: { category: true },
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
      { name: 'cover_image', maxCount: 1 },
    ]),
  )
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
      cover_image?: Express.Multer.File[];
    },
  ) {
    if (files?.logo && files?.logo?.length > 0) {
      req.logo = files.logo[0];
    }
    if (files?.catalogue && files.catalogue?.length > 0) {
      req.catalogue = files.catalogue[0];
    }
    if (files?.cover_image && files.cover_image?.length > 0) {
      req.cover_image = files.cover_image[0];
    }
    req.id = id;
    const storeInfo = await this.userService.updateMainStoreInfo(req);
    return new ActionResponse(storeInfo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('approve-store/:id')
  async adminApproveStore(@Param('id') id: string) {
    return this.userService.adminAcceptStore(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('reject-store/:id')
  async adminRejectStore(@Param('id') id: string) {
    return this.userService.adminRejectStore(id);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService._repo.findOne({
      where: { id },
      relations: { city: true, subscriptions: { package: true } },
    });
    if (!user) throw new NotFoundException('User not found');

    let store = null;
    if (user.roles?.includes(Role.STORE)) {
      store = await this.userService.storeRepo.findOne({
        where: { user_id: id, is_main_branch: true },
        relations: { city: true, subcategory: true },
      });

      if (store) {
        const [branches_count, offers_count, promotional_offers_count] = await Promise.all([
          this.userService.storeRepo.count({ where: { user_id: id } }),
          this.userService.storeRepo.manager
            .createQueryBuilder()
            .select('COUNT(DISTINCT o.id)', 'cnt')
            .from('offer_stores_store', 'os')
            .innerJoin('offer', 'o', 'o.id = os.offer_id AND o.deleted_at IS NULL')
            .innerJoin('store', 's', 's.id = os.store_id AND s.user_id = :uid', { uid: id })
            .getRawOne()
            .then((r) => Number(r?.cnt ?? 0)),
          this.userService.storeRepo.manager
            .createQueryBuilder()
            .select('COUNT(DISTINCT p.id)', 'cnt')
            .from('promotion', 'p')
            .innerJoin('store', 's', 's.id = p.target_id AND s.user_id = :uid', { uid: id })
            .where('p.end_date >= :now', { now: new Date() })
            .getRawOne()
            .then((r) => Number(r?.cnt ?? 0)),
        ]);
        (store as any).branches_count = branches_count;
        (store as any).offers_count = offers_count;
        (store as any).promotional_offers_count = promotional_offers_count;
      }
    }

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
            status: user.status,
            role: user.roles[0],
            created_at: user.created_at,
            subscriptions: user.subscriptions,
            city: user.city,
            store,
          },
          { excludeExtraneousValues: true },
        ),
      ),
    );
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async adminUpdateUser(@Param('id') id: string, @Body() body: AdminUpdateUserRequest) {
    const user = await this.userService._repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (body.name !== undefined) user.name = body.name;
    if (body.email !== undefined) user.email = body.email;
    if (body.phone !== undefined) user.phone = body.phone;
    await this.userService.update(user);
    return new ActionResponse(plainToInstance(UserResponse, user, { excludeExtraneousValues: true }));
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async adminDeleteUser(@Param('id') id: string) {
    return new ActionResponse(await this.userService.deleteUser(id));
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async changeUserStatus(
    @Param('id') id: string,
    @Body() body: ChangeUserStatusRequest,
  ) {
    return new ActionResponse(await this.userService.changeUserStatus(id, body.status));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('test/payment')
  async testPayment() {
    const amount = '10.00';
    return await this.userService.makePayment(amount);
  }
}
