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
    CANCELLED = 'CANCELLED'
}

export interface PaymentRequest {
  paymentMethod: PaymentMethod;
  orderIds: string[];
}

export interface PaymentResponseDto {
  publicId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  orderIds: string[];
  tableSessionId?: string;
  participantId?: string;
  createdAt: string;
  updatedAt?: string;
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