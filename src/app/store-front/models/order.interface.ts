export interface OrderDetailRequest {
  productName: string;
  specialInstructions: string;
}

export interface OrderRequest {
  orderDetails: OrderDetailRequest[];
  specialRequirements?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: number;
  status: string;
  orderDetails: OrderDetailResponse[];
  totalAmount: number;
  createdAt: string;
  tableNumber?: number;
}

export interface OrderDetailResponse {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
}
