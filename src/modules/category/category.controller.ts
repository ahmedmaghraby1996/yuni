import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { SubCategoryService } from '../offers/sub_category.service';
import { GraphInspector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { Category } from 'src/infrastructure/entities/category/category.entity';
import { SubCategory } from 'src/infrastructure/entities/category/subcategory.entity';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { CreateCategoryRequest, CreateSubCategoryRequest, UpdateCategoryRequest, UpdateSubCategoryRequest } from './dto/request/create-category.request';
import { applyQueryIncludes } from 'src/core/helpers/service-related.helper';
@ApiTags('Category')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard,RolesGuard)
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService,private readonly subcategoryService: SubCategoryService ) {}

  @Get()
  async findAll(@Query() query: PaginatedRequest) {
    const categories = await this.categoryService.findAll(query);
    const total = await this.categoryService.count(query);
    const result=plainToInstance(Category,categories,{excludeExtraneousValues: true})
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @Get('/subcategory')
  async findSubCategories(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'category');
    const subcategories = await this.subcategoryService.findAll(query);
    const total = await this.subcategoryService.count(query);
    const result=plainToInstance(SubCategory,subcategories,{excludeExtraneousValues: true})
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

@UseGuards(JwtAuthGuard, RolesGuard)
@Post()
@Roles(Role.ADMIN)
@UseInterceptors(ClassSerializerInterceptor, FileInterceptor('logo'))
@ApiConsumes('multipart/form-data')
async createCategory(
  @Body() req: CreateCategoryRequest,
  @UploadedFile(new UploadValidator().build())
  logo: Express.Multer.File,
): Promise<ActionResponse<Category>> {
  req.logo = logo;
  const category = await this.categoryService.createCategory(req);
  const result = plainToInstance(Category, category, { excludeExtraneousValues: true });
  return new ActionResponse<Category>(result);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Post('/subcategory')
@Roles(Role.ADMIN)
@UseInterceptors(ClassSerializerInterceptor, FileInterceptor('logo'))
@ApiConsumes('multipart/form-data')
async createSubCategory(
  @Body() req: CreateSubCategoryRequest,
  @UploadedFile(new UploadValidator().build())
  logo: Express.Multer.File,
): Promise<ActionResponse<SubCategory>> {
  req.logo = logo;
  const subCategory = await this.categoryService.createSubCategory(req);
  const result = plainToInstance(SubCategory, subCategory, { excludeExtraneousValues: true });
  return new ActionResponse<SubCategory>(result);
}


@UseGuards(JwtAuthGuard, RolesGuard)
@Patch(':id')
@Roles(Role.ADMIN)
@UseInterceptors(ClassSerializerInterceptor, FileInterceptor('logo'))
@ApiConsumes('multipart/form-data')
async updateCategory(
  @Param('id') id: string,
  @Body() req: UpdateCategoryRequest,
  @UploadedFile(new UploadValidator().build())
  logo: Express.Multer.File,
): Promise<ActionResponse<Category>> {
  if (logo) req.logo = logo;
  const category = await this.categoryService.updateCategory(id, req);
  const result = plainToInstance(Category, category, { excludeExtraneousValues: true });
  return new ActionResponse<Category>(result);
}


@UseGuards(JwtAuthGuard, RolesGuard)
@Patch('subcategory/:id')
@Roles(Role.ADMIN)
@UseInterceptors(ClassSerializerInterceptor, FileInterceptor('logo'))
@ApiConsumes('multipart/form-data')
async updateSubCategory(
  @Param('id') id: string,
  @Body() req: UpdateSubCategoryRequest,
  @UploadedFile(new UploadValidator().build())
  logo: Express.Multer.File,
): Promise<ActionResponse<SubCategory>> {
  if (logo) req.logo = logo;
  const subCategory = await this.categoryService.updateSubCategory(id, req);
  const result = plainToInstance(SubCategory, subCategory, { excludeExtraneousValues: true });
  return new ActionResponse<SubCategory>(result);
}


@Delete(':id')
async deleteCategory(@Param('id') id: string) {
  const res = await this.categoryService.softDelete(id);
  return new ActionResponse(res);
}
  @Delete('subcategory/:id')
  async deleteSubCategory(@Param('id') id: string) {
    const res = await this.subcategoryService.softDelete(id);
    return new ActionResponse(res);
  }}



