import { PaymentResponseDto } from "./payment.interface";

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
  orderNumber: string;
  specialRequirements?: string;
  clientAlias: string;
  participantId: string;
  totalPrice: number;
  status: string;
  orderDetails: OrderDetailResponse[];
  orderDate: string
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

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
