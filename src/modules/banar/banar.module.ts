import { Module } from '@nestjs/common';
import { BanarController } from './banar.controller';
import { BanarService } from './banar.service';
import { FileService } from '../file/file.service';

@Module({
  providers: [BanarService,FileService],
  controllers: [BanarController]
})
export class BanarModule {}
