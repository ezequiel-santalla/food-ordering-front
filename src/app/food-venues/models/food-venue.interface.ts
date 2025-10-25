export interface FoodVenue {
  content: Content[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Content {
  publicId: string;
  name: string;
  phone: string;
  address: string;
  location: string;
  styles: VenueStyles | null;
}

export interface Address {
  street: string;
  number: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface VenueStyles {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
