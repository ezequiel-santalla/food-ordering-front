import { BaseAuthResponse } from '../../auth/models/auth';
import { Employment, Participant } from './common';

export interface TableSessionRequest {
  tableId: string;
}

/**
 * Respuesta de sesión de mesa
 * Extiende BaseAuthResponse para reutilizar la estructura de tokens
 */
export interface TableSessionResponse extends BaseAuthResponse {
  tableNumber: number;
  numberOfParticipants?: number;
  tableSessionId?: string;
  startTime: string;
  endTime?: string | null;
  hostClient?: Participant;
  participants: Participant[];
  employments: Employment[];
}

/**
 * Info de sesión de mesa para componentes
 */
export interface TableSessionInfo {
  tableNumber: number;
  participantNickname: string;
  participantCount: number;
  sessionId: string | null;
}
