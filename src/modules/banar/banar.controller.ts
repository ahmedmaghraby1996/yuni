import {
    Body,
    ClassSerializerInterceptor,
    Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { BanarService } from './banar.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { CreateBanarRequest } from './dto/request/create-banar.request';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/guards/roles.decorator';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { Banar } from 'src/infrastructure/entities/banar/banar.entity';
import { plainToInstance } from 'class-transformer';
import { BannerResponse } from './dto/response/banner.response';
import { UpdateBannerRequest } from './dto/request/update-banner.request';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';


@ApiBearerAuth()
@ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Language header: en, ar',
})
@ApiTags('Banar')

@Controller('banar')
export class BanarController {
    constructor(
        private readonly banarService: BanarService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles(Role.ADMIN)
    @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('banar'))
    @ApiConsumes('multipart/form-data')
    async createBanar(
        @Body() req: CreateBanarRequest,
        @UploadedFile(new UploadValidator().build())
        banar: Express.Multer.File,
    ): Promise<ActionResponse<BannerResponse>> {
        req.banar = banar;
        const banner = await this.banarService.createBanar(req);
        const result = plainToInstance(BannerResponse, banner, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse>(result);
    }
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    async getBanars(
        @Query() query: PaginatedRequest
    ): Promise<ActionResponse<BannerResponse[]>> {
        const banners = await this.banarService.findAll(query);
        const count = await this.banarService.count(query);
        const result = plainToInstance(BannerResponse, banners, { excludeExtraneousValues: true })
        if (Object.keys(query).length) {
            return new PaginatedResponse<BannerResponse[]>(result, {
                meta: {
                    total: count,
                    ...query
                }
            });
        }
        return new ActionResponse<BannerResponse[]>(result);
    }
   
    @Get("/guest")
    async getGuestBanars(
        @Query() query: PaginatedRequest
    ): Promise<ActionResponse<BannerResponse[]>> {
        const banners = await this.banarService.getGuestBanars(query);
        const count = await this.banarService.count(query);
        const result = plainToInstance(BannerResponse, banners, { excludeExtraneousValues: true })
        if (Object.keys(query).length) {
            return new PaginatedResponse<BannerResponse[]>(result, {
                meta: {
                    total: count,
                    ...query
                }
            });
        }
        return new ActionResponse<BannerResponse[]>(result);
    }


       
    @Get("/guest/general")
    async getGeneralBanars(
        @Query() query: PaginatedRequest
    ): Promise<ActionResponse<BannerResponse[]>> {
        const banners = await this.banarService.getGeneralBanars(query);
        const count = await this.banarService.count(query);
        const result = plainToInstance(BannerResponse, banners, { excludeExtraneousValues: true })
        if (Object.keys(query).length) {
            return new PaginatedResponse<BannerResponse[]>(result, {
                meta: {
                    total: count,
                    ...query
                }
            });
        }
        return new ActionResponse<BannerResponse[]>(result);
    }
   
    @Get("/Popup/guest")
    async getGuestPopup(
       
    ): Promise<ActionResponse<BannerResponse>> {
        const banners = await this.banarService.getGuestPopup();
    
        const result = plainToInstance(BannerResponse, banners, { excludeExtraneousValues: true })
  
        return new ActionResponse<BannerResponse>(result);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(":banar_id")
    async getBanar(
        @Param('banar_id') id: string,
    ): Promise<ActionResponse<BannerResponse>> {
        const banner = await this.banarService.findOne(id);
        const result = plainToInstance(BannerResponse, banner, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse>(result);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(":id")
    @Roles(Role.ADMIN)
    @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('banar'))
    @ApiConsumes('multipart/form-data')
    async updateBanar(
        @Param('id') id: string,
        @Body() req: UpdateBannerRequest,
        @UploadedFile(new UploadValidator().build())
        banar: Express.Multer.File,
    ): Promise<ActionResponse<BannerResponse>> {
        if (banar) req.banar = banar;
        const banner = await this.banarService.updateBanar(id, req);
        const result = plainToInstance(BannerResponse, banner, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse>(result);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(":id")
    @Roles(Role.ADMIN)
    async deleteBanar(
        @Param('id') id: string,
    ): Promise<ActionResponse<BannerResponse>> {
        const banner = await this.banarService.deleteBanar(id);
        const result = plainToInstance(BannerResponse, banner, { excludeExtraneousValues: true })
        return new ActionResponse<BannerResponse>(result);
    }

}
