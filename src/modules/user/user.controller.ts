import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ActionResponse } from 'src/core/base/responses/action.response';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateFcmRequest } from './dto/update-fcm.request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import {
  applyQueryFilters,
  applyQueryIncludes,
} from 'src/core/helpers/service-related.helper';
import { plainToInstance } from 'class-transformer';
import {
  AcceptAgentRequest,
  AgentResponse,
  UserResponse,
} from './dto/response/user-response';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { GetUserRequest } from './dto/get-user.request';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { RegisterResponse } from '../authentication/dto/responses/register.response';
import { UpdateProfileRequest } from './dto/update-profile-request';
import { ILike, Repository } from 'typeorm';
import { PaymentResponseInterface } from './dto/response/payment.response';
import { InjectRepository } from '@nestjs/typeorm';
import { toUrl } from 'src/core/helpers/file.helper';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import {
  UpdateBranchInfoRequest,
  UpdateStoreInfoRequest,
} from './dto/request/update-store-info.request';
import { AddBranchRequest } from './dto/request/add-branch.request';
import { BranchResponse } from './dto/branch.response';
import { Agent } from 'http';
import { app } from 'firebase-admin';

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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Get('packages')
  async getPackages() {
    const packages = await this.userService.getPackage();
    const result = this._i18nResponse.entity(packages);
    return new ActionResponse(result);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('subscribe/:package_id')
  async subscribePackage(@Param('package_id') package_id: string) {
    const subscribe = await this.userService.buyPackage(package_id);
    return new ActionResponse(subscribe);
  }
  @ApiBearerAuth()
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

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
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
    const count= await this.userService.count(query)
    const users = await this.userService.findAll(query);
    const usersResponse = plainToInstance(AgentResponse, users, {
      excludeExtraneousValues: true,
    })
    return new PaginatedResponse(usersResponse, { meta: { total: count, ...query } });
    
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('reject-agent/:id')
  async rejectAgent(@Param('id') id: string) {
    const agent = await this.userService.rejectAgent(id);
    return new ActionResponse(agent);
  }

  @Post('confirm/payment')
  async handleWebhook(
    @Body() body: any,
    // assuming URWAY sends it in header
  ) {
    const expectedApiKey = process.env.URWAY_WEBHOOK_API_KEY;
    console.log(this.request.headers);
    // 1. Validate API Key
    // if (
    //   !this.request.headers.apiKey ||
    //   this.request.headers.apiKey !== expectedApiKey
    // ) {
    //   throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    // }
    const paymentResponse = Object.assign(new PaymentResponseInterface(), body);

    return this.userService.confirmPayment(paymentResponse);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('profile')
  async getProile() {
    return new ActionResponse(
      plainToInstance(
        UserResponse,
        await this.userService._repo.findOne({
          where: { id: this.request.user.id },
          relations: { city: true, subscriptions: true },
          order: { subscriptions: { created_at: 'DESC' } },
        }),
        { excludeExtraneousValues: true },
      ),
    );
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  //update fcm token
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Put('update-profile')
  async updateProfile(
    @Query() query: GetUserRequest,
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
        await this.userService.updateProfile(query.id, request),
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  //update fcm token
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @Roles(Role.STORE)
  @Put('store-info')
  async updateStoreInfo(
    @Body() req: UpdateStoreInfoRequest,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      catalogue?: Express.Multer.File[];
    },
  ) {
    if (files.logo && files.logo.length > 0) {
      req.logo = files.logo[0];
    }
    if (files.catalogue && files.catalogue.length > 0) {
      req.catalogue = files.catalogue[0];
    }

    // Now you can safely use `logo` and `catalogue`

    const storeInfo = await this.userService.updateMainStoreInfo(req);
    return new ActionResponse(storeInfo);
  }
  @UseInterceptors(
    ClassSerializerInterceptor,
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'catalogue', maxCount: 1 },
    ]),
  )
  @ApiBearerAuth()
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
    console.log(req);

    // Now you can safely use `logo` and `catalogue`
    req.id = id;
    const storeInfo = await this.userService.updateMainStoreInfo(req);
    return new ActionResponse(storeInfo);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('approve-store/:id')
  async adminApproveStore(@Param('id') id: string) {
    return this.userService.adminAcceptStore(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('reject-store/:id')
  async adminRejectStore(@Param('id') id: string) {
    return this.userService.adminRejectStore(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Put('update-branch-info')
  async updateBranchInfo(@Body() req: UpdateBranchInfoRequest) {
    const storeInfo = await this.userService.updateBranchInfo(req);
    return new ActionResponse(storeInfo);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  //DELETE BRANCH
  @Roles(Role.STORE, Role.ADMIN)
  @Delete('delete-branch/:id')
  async deleteBranch(@Param('id') id: string) {
    const branch = await this.userService.deleteBranch(id);
    return new ActionResponse(branch);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Post('add-branch')
  async addBranch(@Body() req: AddBranchRequest) {
    const branch = await this.userService.createBranch(req);
    return new ActionResponse(branch);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE)
  @Get('get-branches')
  async getBranch(@Query('is_main_branch') is_main_branch?: boolean) {
    const branch = await this.userService.getBranches(is_main_branch);

    const resposne = plainToInstance(BranchResponse, branch, {
      excludeExtraneousValues: true,
    });
    const result = this._i18nResponse.entity(resposne);
    return new ActionResponse(result);
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
    const amount = '10.00'; // Example amount
    return await this.userService.makePayment(amount);
  }
}
