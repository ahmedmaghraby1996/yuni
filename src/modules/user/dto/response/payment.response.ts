export class PaymentResponseInterface {
  UserField1: string;
  UserField2?: string; // not provided but might exist
  UserField3: string;
  UserField4: string;
  UserField5: string;
  ResponseCode: string;
  amount: string;
  AuthCode: string;
  maskedPAN: string;
  PaymentId: string;
  ECI: string;
  terminalId: string;
  responseHash: string;
  payFor: string;
  TranId: string;
  cardToken: string;
  Result: string;
  RRN: string;
  metaData: string;
  SubscriptionId: string;
  PaymentType: string;
  cardBrand: string;
  event: string;
  email: string;
  TrackId: string;
}
