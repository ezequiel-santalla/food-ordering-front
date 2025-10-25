export interface ProductResponse {
  content: Content[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface Content {
  publicId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  stock: number;
  available: boolean;
  category: Category | null;
  tags: string[];
}

export interface Category {
  publicId: string;
  name: string;
}

export interface Tag {
  label: string;
}
