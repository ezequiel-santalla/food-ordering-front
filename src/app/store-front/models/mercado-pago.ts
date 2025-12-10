export interface MPCheckoutData {
  token: string;
  payment_method_id: string;
  installments: number;
  issuer_id: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}
