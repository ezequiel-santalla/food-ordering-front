export default interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  available: boolean;
  categoryId?: string | null;
  tags?: string[];
}
