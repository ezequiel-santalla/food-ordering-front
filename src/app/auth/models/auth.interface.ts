import { Participant } from "./table-session";

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  expirationDate: string;
  tableNumber: number;
  participants: Participant[];
}

