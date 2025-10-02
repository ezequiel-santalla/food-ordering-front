export interface Menu {
  foodVenueName:     string;
  foodVenueImageUrl: string;
  menu:              MenuElement[];
}

export interface MenuElement {
  category:     string;
  subcategory?: Subcategory[];  // Para estructura anidada
  products?:    Product[];       // Para estructura plana
}

export interface Subcategory {
  category:     string;
  subcategory?: SubcategoryNested[];
  products?:    Product[];
}

export interface SubcategoryNested {
  category:  string;
  products?: Product[];
}

export interface Product {
  id:          number;
  name:        string;
  description: string;
  image:       string | null;
  price:       number;
  category:    CategoryInfo;
  tags:        Tag[];
}

export interface CategoryInfo {
  id:                 number;
  name:               string;
  childrenCategories: any[];
}

export interface Tag {
  id:    number;
  label: string;
}
