import { TableSessionResponse } from '../../shared/models/table-session';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
  employments?: Employment[];
}

export interface Employment {
  publicId: string;
  role: string;
  restaurant?: {
    publicId: string;
    name: string;
  };
  foodVenueName?: string;
}

export type LoginResponse = AuthResponse | TableSessionResponse;

export function isTableSessionResponse(
  response: LoginResponse
): response is TableSessionResponse {
  return (
    'tableNumber' in response &&
    'participants' in response &&
    'startTime' in response &&
    Array.isArray((response as any).participants)
  );
}

export type {
  Participant,
  User,
  Address,
  TableSessionRequest,
  TableSessionInfo
} from '../../shared/models/table-session';
