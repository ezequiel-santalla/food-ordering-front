export interface TableSessionRequest {
  tableId: string;
}

export interface TableSessionResponse {
  tableNumber: number;
  startTime: string;
  endTime?: string | null;
  hostClient?: Participant;
  participants: Participant[];
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
}

export interface Participant {
  publicId: string;
  user: User;
  nickname: string;
}

export interface User {
  publicId: string;
  name: string;
  lastName: string;
  address: Address;
  email: string;
  birthDate: string;
  phone: string;
  createdAt: string | null;
  removedAt: string | null;
  role: string | null;
}

export interface Address {
  street: string;
  number: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}
