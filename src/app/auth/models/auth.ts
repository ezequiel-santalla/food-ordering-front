import { TableSessionResponse } from './table-session';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
  employments?: Employment[];
}

export interface Employment {
  publicId: string;
  role: string;
  restaurant: {
    publicId: string;
    name: string;
  };
}

export type LoginResponse = AuthResponse | TableSessionResponse;

export function isTableSessionResponse(
  response: LoginResponse
): response is TableSessionResponse {
  return (
    'tableNumber' in response &&
    'participants' in response &&
    'tableSessionId' in response
  );
}

export type {
  Participant,
  User,
  Address,
  TableSessionRequest
} from './table-session';
