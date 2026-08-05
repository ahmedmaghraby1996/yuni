import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { StoreSuggestionService } from './store-suggestion.service';

class SuggestStoreRequest {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false, type: 'string', format: 'binary' }) @IsOptional() image?: any;
}

@ApiTags('Store Suggestion')
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store-suggestion')
export class StoreSuggestionController {
  constructor(private readonly service: StoreSuggestionService) {}

  @Roles(Role.CLIENT)
  @Post()
  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  async suggest(
    @Body() body: SuggestStoreRequest,
    @UploadedFile(new UploadValidator().build()) image?: Express.Multer.File,
  ) {
    return new ActionResponse(await this.service.suggest(body.title, body.description, image));
  }

  @AdminEndpoint()
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  async getAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const { data, total } = await this.service.getAll(Number(page), Number(limit));
    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }
}
