import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import {  LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Banar } from 'src/infrastructure/entities/banar/banar.entity';
import { CreateBanarRequest } from './dto/request/create-banar.request';
import { FileService } from '../file/file.service';

import { UpdateBannerRequest } from './dto/request/update-banner.request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';

@Injectable()
export class BanarService extends BaseService<Banar> {
    constructor(
        @InjectRepository(Banar) private readonly banarRepository: Repository<Banar>,
        @Inject(FileService) private _fileService: FileService,
        @Inject(REQUEST) private readonly request: Request

    ) {
        super(banarRepository);
    }

    async createBanar(banar: CreateBanarRequest) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (new Date(banar.ended_at) < now)
            throw new BadRequestException('message.end_date_must_be_future');
        if (new Date(banar.started_at) < now)
            throw new BadRequestException('message.start_date_must_be_today_or_future');

        const tempImage = await this._fileService.upload(
            banar.banar,
            `banars`,
        );

        let createdBanar = this.banarRepository.create({
            banar: tempImage,
            started_at: banar.started_at,
            ended_at: banar.ended_at,
            is_active: banar.is_active,
            is_popup: banar?.is_popup,
            is_general: banar?.is_general,
            description_ar: banar?.description_ar,
            description_en: banar?.description_en,
        });

        return await this.banarRepository.save(createdBanar);
    }

    async getAdminBanars(page = 1, limit = 10, filters: {
        description?: string;
        start_date?: string;
        end_date?: string;
        is_active?: boolean;
    } = {}) {
        const qb = this.banarRepository.createQueryBuilder('b').orderBy('b.created_at', 'DESC');

        if (filters.description) {
            qb.andWhere('(b.description_ar LIKE :d OR b.description_en LIKE :d)', { d: `%${filters.description}%` });
        }
        if (filters.start_date) qb.andWhere('b.started_at >= :start', { start: filters.start_date });
        if (filters.end_date) qb.andWhere('b.ended_at <= :end', { end: filters.end_date });
        if (filters.is_active !== undefined) qb.andWhere('b.is_active = :is_active', { is_active: filters.is_active });

        const total = await qb.getCount();
        const data = await qb.skip((page - 1) * limit).take(limit).getMany();
        return { data, total };
    }

    async getGuestBanars(query: PaginatedRequest) {
        return await this.banarRepository.find({
            where: {
                is_active: true,
                started_at: LessThanOrEqual(new Date()),
                ended_at: MoreThanOrEqual(new Date()),
                is_popup:false,
                is_general:false
            }
        });
    }

    
    async getGeneralBanars(query: PaginatedRequest) {
        return await this.banarRepository.find({
            where: {
                is_active: true,
                started_at: LessThanOrEqual(new Date()),
                ended_at: MoreThanOrEqual(new Date()),
                is_popup:false,
                is_general:true
            }
        });
    }
    async getGuestPopup() {
        return await this.banarRepository.findOne({
            where: {
                is_active: true,
                started_at: LessThanOrEqual(new Date()),
                ended_at: MoreThanOrEqual(new Date()),
                is_popup:true,
                is_general:false
            }
        });
    }

    async updateBanar(id: string, banar: UpdateBannerRequest) {
        let tempImage = null;
        const banarEntity = await this.banarRepository.findOne({ where: { id } });
        if (!banarEntity) {
            throw new NotFoundException("message.banner_not_found");
        }

        if (banar.banar) {
            tempImage = await this._fileService.upload(
                banar.banar,
                `banars`,
            );
        }

        Object.assign(banarEntity, {
            banar: banar.banar ? tempImage : banarEntity.banar,
            started_at: banar.started_at ? banar.started_at : banarEntity.started_at,
            ended_at: banar.ended_at ? banar.ended_at : banarEntity.ended_at,
            is_active: banar.is_active != null ? banar.is_active : banarEntity.is_active,
            description_ar: banar.description_ar ?? banarEntity.description_ar,
            description_en: banar.description_en ?? banarEntity.description_en,
        });

        return await this.banarRepository.save(banarEntity);
    }

    async deleteBanar(id: string) {
        const banar = await this.banarRepository.findOne({ where: { id } });
        if (!banar) {
            throw new NotFoundException("message.banner_not_found");
        }
        return await this.banarRepository.remove(banar);
    }

    get currentUser(): User {
        return this.request.user;
    }
}
