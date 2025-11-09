import { Module } from '@nestjs/common';
import { StaticPageService } from './static-page.service';
import { StaticPageController } from './static-page.controller';

@Module({
  providers: [StaticPageService],
  controllers: [StaticPageController]
})
export class StaticPageModule {}
