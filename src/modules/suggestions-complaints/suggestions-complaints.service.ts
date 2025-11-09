import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SuggestionsComplaints } from 'src/infrastructure/entities/suggestions-complaints/suggestions-complaints.entity';
import { Repository } from 'typeorm';
import { SuggestionsComplaintsRequest } from './dto/suggestions-complaints.request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseService } from 'src/core/base/service/service.base';

@Injectable()
export class SuggestionsComplaintsService extends BaseService<SuggestionsComplaints> {
  constructor(
    @InjectRepository(SuggestionsComplaints)
    private repo: Repository<SuggestionsComplaints>,
    @Inject(REQUEST) private request: Request,
  ) {super(repo)}

  async getSingleSuggestionsComplaint(id:string): Promise<SuggestionsComplaints> {
    return await this._repo.findOne({where:{id},relations:{user:true}});
  }
  async createSuggestionsComplaints(
    suggestionsComplaintsRequest: SuggestionsComplaintsRequest,
  ): Promise<SuggestionsComplaints> {
    return await this._repo.save({...suggestionsComplaintsRequest,user_id:this.request.user.id});
  }
}
