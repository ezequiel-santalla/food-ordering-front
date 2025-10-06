export interface Menu {
  foodVenueName:     string;
  foodVenueImageUrl: string;
  menu:              MenuElement[];
}

export interface MenuElement {
  category:     string;
  subcategory?: Subcategory[];
  products?:    Product[];
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
  publicId:          string;
  name:        string;
  description: string;
  imageUrl:    string;
  price:       number;
  category:    string;
  tags:        Tag[];
}

export interface Tag {
  id:    number;
  label: string;
}
