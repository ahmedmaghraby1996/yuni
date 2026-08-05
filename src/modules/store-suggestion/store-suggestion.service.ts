import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { StoreSuggestion } from 'src/infrastructure/entities/store-suggestion/store-suggestion.entity';
import { FileService } from '../file/file.service';

@Injectable()
export class StoreSuggestionService {
  constructor(
    @InjectRepository(StoreSuggestion)
    private readonly repo: Repository<StoreSuggestion>,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(FileService) private readonly fileService: FileService,
  ) {}

  async suggest(title?: string, description?: string, image?: Express.Multer.File) {
    const user_id = this.request.user.id;

    let imagePath: string | null = null;
    if (image) {
      imagePath = await this.fileService.upload(image, 'store-suggestions');
    }

    await this.repo.save({ user_id, title, description, image: imagePath });
    return true;
  }

  async getAll(page = 1, limit = 10) {
    const [data, total] = await this.repo.findAndCount({
      relations: { user: true },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
