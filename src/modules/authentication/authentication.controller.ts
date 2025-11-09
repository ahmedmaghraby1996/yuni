import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
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
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { Router } from 'src/core/base/router';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { AuthenticationService } from './authentication.service';
import {
  AgentRegisterRequest,
  RegisterRequest,
} from './dto/requests/register.dto';
import { SendOtpRequest } from './dto/requests/send-otp.dto';
import { GoogleSigninRequest, LoginRequest } from './dto/requests/signin.dto';
import { VerifyOtpRequest } from './dto/requests/verify-otp.dto';
import { AuthResponse } from './dto/responses/auth.response';
import { RegisterResponse } from './dto/responses/register.response';
import { Roles } from './guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { FamilyMemberRequest } from './dto/requests/family-member.request';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm/repository/Repository';
import { RequestResetPassword } from './dto/requests/request-reset-password';
import { ResetPasswordRequest } from './dto/requests/reset-password';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import {
  CreateCityRequest,
  UpdateCityRequest,
} from './dto/requests/create-city.request';
import { AddSecurityGradeRequest } from './dto/requests/add-security-garde.request';
import { City } from 'src/infrastructure/entities/city/city.entity';

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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Post('agent-register')
  async Agentregister(
    @Body() req: AgentRegisterRequest,
  ): Promise<ActionResponse<RegisterResponse>> {
    const user = await this.authService.registerAgent(req);
    const result = plainToInstance(RegisterResponse, user, {
      excludeExtraneousValues: true,
    });
    return new ActionResponse<RegisterResponse>(result, {
      statusCode: HttpStatus.CREATED,
    });
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
  //accept header
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Language header: en, ar',
  })
  @Get('/cities')
  async getCities() {
    const cities = await this.cityRepository.find({
      order: { order_by: 'ASC' },
    });
    const result = this._i18nResponse.entity(
      await this.cityRepository.find({ order: { order_by: 'ASC' } }),
    );
    return new ActionResponse(
      cities.map((city) => {
        return {
          id: city.id,
          //get  name from result
          name: result.find((item) => item.id === city.id).name,
          name_ar: city.name_ar,
          name_en: city.name_en,
          order_by: city.order_by,
        };
      }),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('create/city')
  async createCity(@Body() req: CreateCityRequest) {
    const city = await this.cityRepository.save(req);
    await this.resortCities();
    return new ActionResponse(city);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Put('edit/city/:id')
  async updateCity(@Param('id') id: string, @Body() req: UpdateCityRequest) {
    req.id = id;
    const city = await this.cityRepository.update(req.id, req);
    await this.resortCities();
    return new ActionResponse(city);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('delete/city/:id')
  async delete(@Param('id') id: string) {
    const city = await this.cityRepository.softDelete(id);
    await this.resortCities();
    return new ActionResponse(city);
  }

  async resortCities() {
    await this.cityRepository.query(`
       UPDATE city
JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY order_by ASC) AS new_order
    FROM city
) AS RankedCities ON city.id = RankedCities.id
SET city.order_by = RankedCities.new_order;

      `);

    // Return updated cities, if needed
    const cities = await this.cityRepository.find({
      order: { order_by: 'ASC' },
    });
    return new ActionResponse(cities);
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
