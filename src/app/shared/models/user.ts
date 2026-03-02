export interface UserDetailResponseDto {
  publicId: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: AddressResponseDto | null;
}

export interface AddressResponseDto {
  id: number;
  street: string;
  number: string;
  additionalInfo?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}