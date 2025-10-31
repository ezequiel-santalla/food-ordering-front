import { Employment } from "../../shared/models/common";
import { TableSessionResponse } from "../../shared/models/table-session";

/**
 * Base para cualquier respuesta de autenticación
 * Contiene los tokens y datos comunes
 */
export interface BaseAuthResponse {
  accessToken: string;
  refreshToken?: string;
  expirationDate: string;
}

/**
 * Respuesta de login simple (sin sesión de mesa)
 */
export interface AuthResponse extends BaseAuthResponse {
  refreshToken: string;
  employments?: Employment[];
}

export type LoginResponse = AuthResponse | TableSessionResponse;

/**
 * Type guard para diferencia entre AuthResponse y TableSessionResponse
 */
export function isTableSessionResponse(
  response: LoginResponse
): response is TableSessionResponse {
  return (
    'tableNumber' in response &&
    'activeParticipants' in response &&
    'startTime' in response &&
    Array.isArray((response as any).participants)
  );
}
