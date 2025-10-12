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

export interface TableSessionRequest {
  tableId: string;
}

export interface TableSessionResponse {
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
  tableNumber: number;
  tableSessionId: string;
  startTime: string;
  endTime?: string | null;
  hostClient?: Participant;
  participants: Participant[];
}
