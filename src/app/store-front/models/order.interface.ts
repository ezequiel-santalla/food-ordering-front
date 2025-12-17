import {
  PaymentMethod,
  PaymentResponseDto,
  PaymentStatus,
} from './payment.interface';

export interface OrderDetailRequest {
  productName: string;
  specialInstructions: string;
}

export interface OrderRequest {
  orderDetails: OrderDetailRequest[];
  specialRequirements?: string;
}

export interface OrderResponse {
  publicId: string;
  orderNumber: number;
  specialRequirements?: string;
  clientAlias: string;
  participantId: string;
  totalPrice: number;
  status: OrderStatus;
  orderDetails: OrderDetailResponse[];
  orderDate: string;
  tableNumber: number;
  payment?: PaymentResponseDto | null;
}

export interface OrderDetailResponse {
  id: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productName: string;
  category: string;
  specialInstructions?: string;
}

export enum OrderStatus {

    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    SERVED = 'SERVED',
    CANCELLED = 'CANCELLED'
    
}