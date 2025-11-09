import { Injectable } from '@nestjs/common';
import { Seeder, DataFactory } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { StaticPage } from 'src/infrastructure/entities/static-pages/static-pages.entity';

@Injectable()
export class StaticPageSeeder implements Seeder {
    constructor(
        @InjectRepository(StaticPage)
        private readonly staticPageRepository: Repository<StaticPage>,
    ) { }

    async seed(): Promise<any> {
        const data = fs.readFileSync('./json/static-pages.json', 'utf8');
        const staticPagesData: StaticPage[] = JSON.parse(data);

        for (const data of staticPagesData) {
            const staticPage = this.staticPageRepository.create(data);

            await this.staticPageRepository.save(staticPage);
        }
    }

    async drop(): Promise<any> {
        return await this.staticPageRepository.delete({});
    }
}