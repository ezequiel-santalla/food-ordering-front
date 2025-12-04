export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  OTHER = 'OTHER'
}

export enum PaymentStatus {

    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED'
}

export interface PaymentRequest {
  idempotencyKey: string;
  paymentMethod: PaymentMethod;
  orderIds: string[];
}

export interface PaymentResponseDto {
  publicId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey: string;
  orderIds: string[];
  tableSessionId?: string;
  participantId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentProcessRequest {
  paymentMethod: PaymentMethod;
  payerEmail: string;
  payerName?: string;
  cardToken?: string;  // Token de Checkout Bricks
  providerMetadata?: {
    payment_method_id?: string;
    installments?: number;
    issuer_id?: string;
  };
}


export interface PaymentProcessResponse {
  paymentId: string;
  paymentIntentId: string;
  paymentStatus: PaymentStatus;
  intentStatus: string;
  amount: number;
  message: string;
  requiresAction?: boolean;
  approvalUrl?: string;
  externalTransactionId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaginatedPayments {
  content: PaymentResponseDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PaymentOrderView {
  publicId: string;
  orderNumber: string;
  items: {
    quantity: number;
    productName: string;
    subtotal?: number;
  }[];
}

export interface CheckoutProResponse {
  preferenceId: string;
  checkoutUrl: string;
  paymentId: string;
}
