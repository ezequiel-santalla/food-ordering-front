export interface CartItem {
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  specialInstructions: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}
