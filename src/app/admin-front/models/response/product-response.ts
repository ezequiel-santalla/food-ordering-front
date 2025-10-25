
// import CategoryResponse from './category-response';
// import TagResponse from './tag-response';

// export default interface ProductResponse {
//     publicId: string;
//     name: string;
//     description: string;
//     imageUrl: string;
//     price: number;
//     stock: number;
//     available: boolean;

//     category: CategoryResponse;
//     tags: TagResponse[];
// }

export interface ProductResponse {
  content:       Content[];
  pageNumber:    number;
  pageSize:      number;
  totalElements: number;
  totalPages:    number;
  first:         boolean;
  last:          boolean;
  empty:         boolean;
}

export interface Content {
  publicId:    string;
  name:        string;
  description: string;
  imageUrl:    string;
  price:       number;
  stock:       number;
  available:   boolean;
  category?:    Category;
  tags?:        Tag[];
}

export interface Category {
  publicId:           string;
  name:               string;
  childrenCategories: Category[];
}

export interface Tag {
  id:    number;
  label: Label;
}

export enum Label {
  Artesanal = "Artesanal",
  Picante = "Picante",
  SinGluten = "Sin Gluten",
  Vegano = "Vegano",
  Vegetariano = "Vegetariano",
}
