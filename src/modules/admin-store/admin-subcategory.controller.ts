import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdminEndpoint } from 'src/core/decorators/admin-endpoint.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { FileService } from '../file/file.service';
import {
  CreateSubCategoryRequest,
  UpdateSubCategoryRequest,
} from '../category/dto/request/create-category.request';

@ApiTags('Admin Subcategories')
@AdminEndpoint()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/subcategories')
export class AdminSubcategoryController {
  constructor(
    @InjectRepository(SubCategory)
    private readonly subCategoryRepo: Repository<SubCategory>,
    private readonly fileService: FileService,
  ) {}

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category_id', required: false, type: String })
  @Get()
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('category_id') category_id?: string,
  ) {
    const qb = this.subCategoryRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.category', 'category')
      .orderBy('sub.order_by', 'ASC');

    if (category_id) qb.where('sub.category_id = :category_id', { category_id });

    const total = await qb.getCount();
    const data = await qb
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getMany();

    return new PaginatedResponse(data, { meta: { total, page: Number(page), limit: Number(limit) } });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const sub = await this.subCategoryRepo.findOne({
      where: { id },
      relations: { category: true },
    });
    return new ActionResponse(sub);
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() req: CreateSubCategoryRequest,
    @UploadedFile(new UploadValidator().build()) logo?: Express.Multer.File,
  ) {
    if (logo) req.logo = logo;
    const sub = this.subCategoryRepo.create({
      name_ar: req.name_ar,
      name_en: req.name_en,
      category_id: req.category_id as any,
      order_by: req.order_by,
      is_active: req.is_active ?? true,
      logo: logo ? await this.fileService.upload(logo, 'subcategories') : undefined,
    });
    return new ActionResponse(await this.subCategoryRepo.save(sub));
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() req: UpdateSubCategoryRequest,
    @UploadedFile(new UploadValidator().build()) logo?: Express.Multer.File,
  ) {
    const sub = await this.subCategoryRepo.findOneBy({ id });
    if (req.name_ar !== undefined) sub.name_ar = req.name_ar;
    if (req.name_en !== undefined) sub.name_en = req.name_en;
    if (req.category_id !== undefined) sub.category_id = req.category_id as any;
    if (req.order_by !== undefined) sub.order_by = req.order_by;
    if (req.is_active !== undefined) sub.is_active = req.is_active;
    if (logo) sub.logo = await this.fileService.upload(logo, 'subcategories');
    return new ActionResponse(await this.subCategoryRepo.save(sub));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const sub = await this.subCategoryRepo.findOneBy({ id });
    return new ActionResponse(await this.subCategoryRepo.softRemove(sub));
  }
}
