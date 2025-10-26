export interface CartItem {
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  specialInstructions: string | null;
}

export interface Cart {
  items: CartItem[];
  total: number;
}
