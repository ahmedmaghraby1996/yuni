import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FaqQuestion } from "src/infrastructure/entities/faq/faq_question";
import { FaqController } from "./faq.controller";
import { FaqService } from "./faq.service";

@Module({
  
    imports: [
    
      TypeOrmModule.forFeature([FaqQuestion])],
    controllers: [FaqController],
    providers: [FaqService],  

  })
  export class FaqModule {}