export interface UserProfile {
  publicId: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  address?: Address;
}

export interface Address {
  street: string;
  number: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

export interface UpdateUserProfileRequest {
  name: string;
  lastName: string;
  phone: string;
  birthDate: string;
  address?: Address;
}
