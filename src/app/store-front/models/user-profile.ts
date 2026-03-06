export interface UserProfile {
  publicId: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  address?: AddressResponse;
  pictureUrl?: string;
}

export interface AddressResponse {
  street: string;
  number: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  cityId: number;
  provinceId: number;
  countryId: number;
}

export interface AddressRequest {
  street: string;
  number: string;
  postalCode: string;
  cityId: number;
}

export interface UpdateUserProfileRequest {
  name: string;
  lastName: string;
  phone: string;
  birthDate: string;
  address?: AddressRequest;
}
