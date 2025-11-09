import { Controller, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/core/base/service/service.base";

import { FaqQuestion } from "src/infrastructure/entities/faq/faq_question";
import { Repository } from "typeorm";

@Injectable()
export class FaqService extends BaseService<FaqQuestion>{
    constructor(    
    @InjectRepository(FaqQuestion) public  faq_question_repo:Repository<FaqQuestion>
    ){
        super(  faq_question_repo);
      
    }
  

    async getQuestion():Promise<FaqQuestion[]>{
       
            return   await this.faq_question_repo.find()
            
    }
}