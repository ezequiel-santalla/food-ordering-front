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
  totalPrice: number;
  status: string;
  orderDetails: OrderDetailResponse[];
}

export interface OrderDetailResponse {
  id: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productName: string;
  category: string;
  specialInstructions?: string;
}
