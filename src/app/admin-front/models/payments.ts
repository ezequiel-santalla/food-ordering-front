
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA';

export interface PaymentResponse {
  publicId: string;
  amount: number;
  status: PaymentStatus;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  orderNumbers: number[];
  tableNumber: number;
}

export interface PaymentRequest {
  paymentMethod: PaymentMethod;
  orderIds: string[];
}

export interface PaymentPageResponse {
  content: PaymentResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
