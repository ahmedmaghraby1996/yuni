import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { Router } from 'src/core/base/router';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { AuthenticationService } from './authentication.service';
import { RegisterRequest, RegisterStoreRequest } from './dto/requests/register.dto';
import { SendOtpRequest } from './dto/requests/send-otp.dto';
import { GoogleSigninRequest, LoginRequest } from './dto/requests/signin.dto';
import { VerifyOtpRequest } from './dto/requests/verify-otp.dto';
import { AuthResponse } from './dto/responses/auth.response';
import { RegisterResponse } from './dto/responses/register.response';
import { RequestResetPassword, ForgotPasswordRequestOtpRequest, ForgotPasswordVerifyOtpRequest, ForgotPasswordResetRequest } from './dto/requests/request-reset-password';
import { ResetPasswordRequest } from './dto/requests/reset-password';
import { RefreshTokenRequest } from './dto/requests/refresh-token.request';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
import { FileService } from '../file/file.service';

@ApiTags(Router.Auth.ApiTag)
@Controller(Router.Auth.Base)
export class AuthenticationController {
  constructor(
    @Inject(AuthenticationService)
    private readonly authService: AuthenticationService,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    private readonly fileService: FileService,
  ) {}

  @Post(Router.Auth.Signin)
  async signin(
    @Body() req: LoginRequest,
  ): Promise<ActionResponse<AuthResponse>> {
    const authData = await this.authService.login(
      await this.authService.validateUser(req),
    );
    const result = plainToInstance(
      AuthResponse,
      { ...authData, role: authData.roles[0] },
      {
        excludeExtraneousValues: true,
      },
    );
    return new ActionResponse<AuthResponse>(result);
  }

  @Post('refresh-token')
  async refreshToken(
    @Body() req: RefreshTokenRequest,
  ): Promise<ActionResponse<AuthResponse>> {
    const authData = await this.authService.refreshToken(req.refresh_token);
    const result = plainToInstance(
      AuthResponse,
      { ...authData, role: authData.roles[0] },
      {
        excludeExtraneousValues: true,
      },
    );
    return new ActionResponse<AuthResponse>(result);
  }

  @Post('google-sign-in')
  async googleSignin(@Body() req: GoogleSigninRequest) {
    const user = await this.authService.googleSignin(req);
    return new ActionResponse(
      plainToInstance(AuthResponse, user, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Post('apple-sign-in')
  async apppleSignin(@Body() req: GoogleSigninRequest) {
    const user = await this.authService.getAppleUserFromToken(req.token);

    return new ActionResponse(
      plainToInstance(AuthResponse, user, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @Post(Router.Auth.Register)
  async register(
    @Body() req: RegisterRequest,
    @UploadedFile(new UploadValidator().build())
    avatarFile: Express.Multer.File,
  ): Promise<ActionResponse<RegisterResponse>> {
    req.avatarFile = avatarFile;
    const user = await this.authService.register(req);
    const result = plainToInstance(RegisterResponse, user, {
      excludeExtraneousValues: true,
    });
    return new ActionResponse<RegisterResponse>(result, {
      statusCode: HttpStatus.CREATED,
    });
  }

  

  @UseInterceptors(
    ClassSerializerInterceptor,
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'cover_image', maxCount: 1 },
      { name: 'commercial_registration_file', maxCount: 1 },
      { name: 'vat_certificate_file', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @Post('register-store')
  async registerStore(
    @Body() req: RegisterStoreRequest,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      cover_image?: Express.Multer.File[];
      commercial_registration_file?: Express.Multer.File[];
      vat_certificate_file?: Express.Multer.File[];
    },
  ): Promise<ActionResponse<RegisterResponse>> {
    // 1. Create user + main branch (existing transaction)
    const registerReq = new RegisterRequest();
    registerReq.name = req.name;
    registerReq.password = req.password;
    registerReq.phone = req.phone;
    registerReq.email = req.email;
    registerReq.role = Role.STORE;

    const user = await this.authService.register(registerReq);

    // 2. Update the main branch with store-specific fields
    const store = await this.storeRepository.findOne({ where: { user_id: user.id, is_main_branch: true } });
    if (store) {
      if (req.store_name) store.name = req.store_name;
      if (req.subcategory_id) store.subcategory_id = req.subcategory_id as any;
      if (req.city_id) store.city_id = req.city_id;
      if (req.address) store.address = req.address;
      if (req.description) store.description = req.description;
      if (req.first_phone) store.first_phone = req.first_phone;
      if (req.second_phone) store.second_phone = req.second_phone;
      if (req.whatsapp_link) store.whatsapp_link = req.whatsapp_link;
      if (req.store_type) store.store_type = req.store_type;
      if (req.latitude != null) store.latitude = req.latitude;
      if (req.longitude != null) store.longitude = req.longitude;
      if (files?.logo?.[0]) store.logo = await this.fileService.upload(files.logo[0], 'stores');
      if (files?.cover_image?.[0]) store.cover_image = await this.fileService.upload(files.cover_image[0], 'stores');
      if (files?.commercial_registration_file?.[0]) store.commercial_registration = await this.fileService.upload(files.commercial_registration_file[0], 'stores');
      if (files?.vat_certificate_file?.[0]) store.vat_certificate = await this.fileService.upload(files.vat_certificate_file[0], 'stores');
      store.is_active = false;
      store.status = StoreStatus.PENDING;
      await this.storeRepository.save(store);
    }

    const result = plainToInstance(RegisterResponse, user, { excludeExtraneousValues: true });
    return new ActionResponse<RegisterResponse>(result, { statusCode: HttpStatus.CREATED });
  }

  @ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
  @Get('/cities')
  async getCities() {
    const cities = await this.cityRepository.find({ order: { order_by: 'ASC' } });
    const result = this._i18nResponse.entity(cities);
    return new ActionResponse(
      cities.map((city) => ({
        id: city.id,
        name: result.find((item: City) => item.id === city.id).name,
        name_ar: city.name_ar,
        name_en: city.name_en,
        order_by: city.order_by,
      })),
    );
  }

  @Post(Router.Auth.SendOtp)
  async snedOtp(@Body() req: SendOtpRequest): Promise<ActionResponse<string>> {
    const result = await this.authService.sendOtp(req);
    return new ActionResponse<string>(result.toString());
  }

  @Post(Router.Auth.VerifyOtp)
  async verifyOtp(
    @Body() req: VerifyOtpRequest,
  ): Promise<ActionResponse<AuthResponse>> {
    const data = await this.authService.verifyOtp(req);
    const result = plainToInstance(AuthResponse, data, {
      excludeExtraneousValues: true,
    });
    return new ActionResponse<AuthResponse>(result);
  }
  @Post(Router.Auth.RequestResetPasswordEmail)
  async requestResetPassword(
    @Body() req: RequestResetPassword,
  ): Promise<ActionResponse<boolean>> {
    const result = await this.authService.requestResetPassword(req);

    return new ActionResponse<boolean>(result);
  }

  @Post(Router.Auth.ResetPassword)
  async resetPassword(
    @Param('token') resetToken: string,
    @Body() req: ResetPasswordRequest,
  ): Promise<ActionResponse<AuthResponse>> {
    const result = await this.authService.resetPassword(resetToken, req);

    return new ActionResponse<AuthResponse>(result);
  }

  @Post('forgot-password/request-otp')
  async forgotPasswordRequestOtp(
    @Body() req: ForgotPasswordRequestOtpRequest,
  ): Promise<ActionResponse<boolean>> {
    const result = await this.authService.forgotPasswordRequestOtp(req);
    return new ActionResponse<boolean>(result);
  }

  @Post('forgot-password/verify-otp')
  async forgotPasswordVerifyOtp(
    @Body() req: ForgotPasswordVerifyOtpRequest,
  ): Promise<ActionResponse<{ reset_token: string }>> {
    const result = await this.authService.forgotPasswordVerifyOtp(req);
    return new ActionResponse(result);
  }

  @Post('forgot-password/reset')
  async forgotPasswordReset(
    @Body() req: ForgotPasswordResetRequest,
  ): Promise<ActionResponse<boolean>> {
    const result = await this.authService.forgotPasswordReset(req);
    return new ActionResponse<boolean>(result);
  }
}
