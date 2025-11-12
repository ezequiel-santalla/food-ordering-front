export interface OrderDetailRequest {
  productName: string;
  specialInstructions: string;
  quantity: number;
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
  status: OrderStatus;
  orderDetails: OrderDetailResponse[];
  orderDate: string;
  tableNumber: number;
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

// Estados de orden según tu backend
export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SERVED'
  | 'CANCELLED';
