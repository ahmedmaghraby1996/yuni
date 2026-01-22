import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqQuestion } from 'src/infrastructure/entities/faq/faq_question';

@Injectable()
export class FaqSeeder implements Seeder {
  constructor(
    @InjectRepository(FaqQuestion)
    private readonly faqRepository: Repository<FaqQuestion>,
  ) {}

  async seed(): Promise<void> {
    const questions = [
      new FaqQuestion({
        title_ar: 'كم تستغرق عملية التوصيل؟',
        title_en: 'How long does the delivery process take?',
        descrption_ar:
          'تستغرق عملية التوصيل عادةً من 3 إلى 5 أيام عمل داخل المدن الرئيسية.',
        descrption_en:
          'Delivery usually takes 3 to 5 business days within major cities.',
      }),
      new FaqQuestion({
        title_ar: 'ما هي طرق الدفع المتاحة؟',
        title_en: 'What rely payment methods are available?',
        descrption_ar:
          'يمكنك الدفع عبر البطاقات الائتمانية، أبل باي، أو الدفع عند الاستلام.',
        descrption_en:
          'You can pay via credit cards, Apple Pay, or Cash on Delivery.',
      }),
      new FaqQuestion({
        title_ar: 'كيف يمكنني تتبع طلبي؟',
        title_en: 'How can I track my order?',
        descrption_ar: "يمكنك تتبع طلبك من خلال صفحة 'طلباتي' في التطبيق.",
        descrption_en:
          "You can track your order through the 'My Orders' page in the app.",
      }),
      new FaqQuestion({
        title_ar: 'هل يمكنني إرجاع المنتجات؟',
        title_en: 'Can I return products?',
        descrption_ar:
          'نعم، يمكنك إرجاع المنتجات خلال 14 يومًا من تاريخ الاستلام وفقًا لسياسة الإرجاع.',
        descrption_en:
          'Yes, you can return products within 14 days of receipt according to the return policy.',
      }),
      new FaqQuestion({
        title_ar: 'كيف يمكنني التواصل مع خدمة العملاء؟',
        title_en: 'How can I contact customer service?',
        descrption_ar:
          'يمكنك التواصل معنا عبر الدردشة المباشرة في التطبيق أو عن طريق البريد الإلكتروني.',
        descrption_en:
          'You can contact us via live chat in the app or by email.',
      }),
    ];

    await this.faqRepository.save(questions);
  }

  async drop(): Promise<void> {
    await this.faqRepository.delete({});
  }
}
