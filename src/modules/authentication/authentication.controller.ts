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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { Router } from 'src/core/base/router';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { AuthenticationService } from './authentication.service';
import { RegisterRequest } from './dto/requests/register.dto';
import { SendOtpRequest } from './dto/requests/send-otp.dto';
import { GoogleSigninRequest, LoginRequest } from './dto/requests/signin.dto';
import { VerifyOtpRequest } from './dto/requests/verify-otp.dto';
import { AuthResponse } from './dto/responses/auth.response';
import { RegisterResponse } from './dto/responses/register.response';
import { RequestResetPassword } from './dto/requests/request-reset-password';
import { ResetPasswordRequest } from './dto/requests/reset-password';
import { RefreshTokenRequest } from './dto/requests/refresh-token.request';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { I18nResponse } from 'src/core/helpers/i18n.helper';

@ApiTags(Router.Auth.ApiTag)
@Controller(Router.Auth.Base)
export class AuthenticationController {
  constructor(
    @Inject(AuthenticationService)
    private readonly authService: AuthenticationService,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
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
}
