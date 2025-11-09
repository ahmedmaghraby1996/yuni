import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { Repository } from 'typeorm';
import { StaticPage } from 'src/infrastructure/entities/static-pages/static-pages.entity';
import { UpdateStaticPageRequest } from './dto/request/update-static-page.request';
import { StaticPagesEnum } from 'src/infrastructure/data/enums/static-pages.enum';

@Injectable()
export class StaticPageService extends BaseService<StaticPage> {
    constructor(
        @InjectRepository(StaticPage) private readonly staticPageRepository: Repository<StaticPage>,
    ) {
        super(staticPageRepository);
    }

    async updateStaticPageByType(staticPage: UpdateStaticPageRequest): Promise<StaticPage> {
        const staticPageEntity = await this.staticPageRepository.
            findOne({
                where: {
                    static_page_type: staticPage.static_page_type
                }
            });

        if (!staticPageEntity) {
            throw new NotFoundException('Static page not found');
        }

        Object.assign(staticPageEntity, staticPage);
        return await this.staticPageRepository.save(staticPageEntity);
    }

    async getStaticPageByType(staticPageType: StaticPagesEnum): Promise<StaticPage> {
        const staticPage = await this.staticPageRepository.findOne({
            where: {
                static_page_type: staticPageType
            }
        });

        if (!staticPage) {
            throw new NotFoundException('Static page not found');
        }

        return staticPage;
    }
}
