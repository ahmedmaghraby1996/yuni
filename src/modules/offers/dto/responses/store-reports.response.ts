export class OfferSummary {
  id: string;
  title_ar: string;
  title_en: string;
  usage_count: number;
}

export class StoreReportsResponse {
  total_code_usage: number;
  total_coupons_used: number;
  total_customer_reach: number;
  conversion_rate: number;
  best_offer: OfferSummary | null;
  worst_offer: OfferSummary | null;
}
