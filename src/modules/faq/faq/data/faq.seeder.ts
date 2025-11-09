import { DataFactory, Seeder } from 'nestjs-seeder';
import { FaqCategory } from '../faq-category';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { FaqQuestion } from '../faq_question';

@Injectable()
export class FaqSeeder implements Seeder {
  constructor(
 
    @InjectRepository(FaqQuestion)
    private readonly question: Repository<FaqQuestion>,
  ) {}
  async seed(): Promise<any> {


    const questions = [new FaqQuestion({
      title_ar:"السؤال 2",
      title_en:"question 2",
      descrption_ar: '2 الجواب',
      descrption_en: '2 answer',
      // category: faq_category[0],
    }),
    new FaqQuestion({
      title_ar:"السؤال 1",
      title_en:"question 1",
      descrption_ar: '1 الجواب',
      descrption_en: '1 answer',
      // category: faq_category[0],
    }),
    new FaqQuestion({
      title_ar:"السؤال 1",
      title_en:"question 1",
      descrption_ar: '1 الجواب',
      descrption_en: '1 answer',
      // category: faq_category[1],
    })
  
  ]
  
    // this.questions.save(questions);
    // faqs[0]= new FaqCategory({name:"test"}) as any;
    // questions[0] = new FaqQuestion({id:"1",title:"test",descrption:"test",faq_category:faqs[0] as any}) as any;

    // faqs[1]= new FaqCategory({name:"test1",}) as any;
    // questions[1] = new FaqQuestion({id:"2",title:"test1",descrption:"test1",faq_category:faqs[1] as any}) as any;

    await this.question.save(questions);
  }
  drop(): Promise<any> {
   
    return this.question.delete({});
  }
}
