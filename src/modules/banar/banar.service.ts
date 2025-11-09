import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
        const tempImage = await this._fileService.upload(
            banar.banar,
            `banars`,
        );

        let createdBanar = this.banarRepository.create({
            banar: tempImage,
            started_at: banar.started_at,
            ended_at: banar.ended_at,
            is_active: banar.is_active,
            is_popup:banar?.is_popup,
            is_general:banar?.is_general
        });

        return await this.banarRepository.save(createdBanar);
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
