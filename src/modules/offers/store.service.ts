import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
@Injectable()
export class StoreService extends BaseService<Store> {
  constructor(
    @InjectRepository(Store)
    public readonly repo: Repository<Store>,
    @Inject(REQUEST) private readonly _request: Request,
  ) {
    super(repo);
  }

  getDetails(id:string) {
    return this.repo.findOne({
      where: { id: id },
      relations: { user: true ,category: true,},
    });
  }
}
