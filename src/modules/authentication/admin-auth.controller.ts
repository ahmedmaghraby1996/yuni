import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { AuthenticationService } from './authentication.service';
import { LoginRequest } from './dto/requests/signin.dto';
import { AuthResponse } from './dto/responses/auth.response';
import { CreateCityRequest, UpdateCityRequest } from './dto/requests/create-city.request';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { I18nResponse } from 'src/core/helpers/i18n.helper';

@ApiTags('Admin')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@Controller('admin')
export class AdminAuthController {
  constructor(
    @Inject(AuthenticationService) private readonly authService: AuthenticationService,
    @InjectRepository(City) private readonly cityRepository: Repository<City>,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
  ) {}

  @AdminEndpoint()
  @Post('auth/signin')
  async adminSignin(@Body() req: LoginRequest): Promise<ActionResponse<AuthResponse>> {
    const user = await this.authService.validateUser(req);
    if (!user) throw new BadRequestException('message.invalid_credentials');
    if (!user.roles?.includes(Role.ADMIN)) {
      throw new BadRequestException('message.invalid_credentials');
    }
    const authData = await this.authService.login(user);
    const result = plainToInstance(
      AuthResponse,
      { ...authData, role: authData.roles[0] },
      { excludeExtraneousValues: true },
    );
    return new ActionResponse<AuthResponse>(result);
  }

  // ─── Cities ────────────────────────────────────────────────────────────────

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('cities')
  async getCities() {
    const cities = await this.cityRepository.find({ order: { order_by: 'ASC' } });
    const result = this._i18nResponse.entity(cities);
    return new ActionResponse(
      cities.map((city) => ({
        id: city.id,
        name: result.find((item) => item.id === city.id).name,
        name_ar: city.name_ar,
        name_en: city.name_en,
        order_by: city.order_by,
      })),
    );
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('cities')
  async createCity(@Body() req: CreateCityRequest) {
    const city = await this.cityRepository.save(req);
    await this.resortCities();
    return new ActionResponse(city);
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('cities/:id')
  async updateCity(@Param('id') id: string, @Body() req: UpdateCityRequest) {
    req.id = id;
    await this.cityRepository.update(id, req);
    await this.resortCities();
    return new ActionResponse(await this.cityRepository.findOneBy({ id }));
  }

  @AdminEndpoint()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('cities/:id')
  async deleteCity(@Param('id') id: string) {
    const result = await this.cityRepository.softDelete(id);
    await this.resortCities();
    return new ActionResponse(result);
  }

  private async resortCities() {
    await this.cityRepository.query(`
      UPDATE city
      JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_by ASC) AS new_order
        FROM city
      ) AS ranked ON city.id = ranked.id
      SET city.order_by = ranked.new_order
    `);
  }
}
