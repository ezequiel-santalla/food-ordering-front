import { AuthResponse, LoginResponse } from '../auth/models/auth';
import { Employment } from '../shared/models/common';
import { TableSessionResponse } from '../shared/models/table-session';
import { JwtUtils } from './jwt-utils';
import { SessionUtils } from './session-utils';

/**
 * Maneja toda la lógica relacionada con tokens y datos de sesión
 */
export class TokenManager {
  /**
   * Procesa una respuesta de autenticación simple (login sin sesión de mesa)
   */
  static processAuthResponse(authResponse: AuthResponse): ProcessedAuthData {
    console.log('🔑 Procesando AuthResponse simple');

    const { accessToken, refreshToken, expirationDate, employments } =
      authResponse;
    const sessionData = this.extractSessionDataFromToken(accessToken);

    console.log("Roles disponibles: ", employments);

    return {
      accessToken,
      refreshToken,
      expirationDate,
      ...sessionData,
      tableNumber: null,
      participantCount: null,
      employments: employments || [],
    };
  }

  /**
   * Procesa una respuesta de sesión de mesa (login con mesa o scan QR)
   */
  static processTableSessionResponse(
    response: TableSessionResponse,
    fallbackRefreshToken: string | null
  ): ProcessedAuthData {
    console.log('🪑 Procesando TableSessionResponse');

    const finalRefreshToken = this.resolveRefreshToken(
      response.refreshToken,
      fallbackRefreshToken
    );

    const sessionData = this.extractSessionDataFromToken(response.accessToken);

    return {
      accessToken: response.accessToken,
      refreshToken: finalRefreshToken,
      expirationDate: response.expirationDate,
      ...sessionData,
      tableNumber: response.tableNumber ?? null,
      participantCount: response.numberOfParticipants || 0,
      employments: response.employments || [],
    };
  }

  /**
   * Valida que los tokens sean válidos antes de guardarlos
   */
  static validateTokens(accessToken: string, refreshToken: string): void {
    if (!accessToken) {
      throw new Error('AccessToken inválido recibido del servidor');
    }

    // Para invitados (refreshToken = 'guest'), solo validar accessToken
    if (refreshToken !== 'guest' && !refreshToken) {
      throw new Error('RefreshToken inválido recibido del servidor');
    }

    if (!JwtUtils.isValidToken(accessToken)) {
      throw new Error('AccessToken inválido o expirado');
    }

    console.log('✅ Tokens validados correctamente', {
      isGuest: refreshToken === 'guest',
    });
  }

  /**
   * Guarda tokens en localStorage
   */
  static saveTokens(
    accessToken: string,
    refreshToken: string,
    expirationDate?: string
  ): void {
    this.validateTokens(accessToken, refreshToken);

    let finalExpiration = expirationDate ?? null;

    try {
      const decoded = JwtUtils.decodeJWT(accessToken);
      if (decoded?.exp) {
        finalExpiration = new Date(decoded.exp * 1000).toISOString();
      }
    } catch (e) {
      console.warn('No se pudo derivar expiration desde el token', e);
    }

    SessionUtils.setStorageValue('accessToken', accessToken);
    SessionUtils.setStorageValue('refreshToken', refreshToken);
    SessionUtils.setStorageValue('expirationDate', finalExpiration);

    console.log('✅ Tokens guardados en localStorage', {
      isGuest: refreshToken === 'guest',
    });
  }

  /**
   * Guarda datos de sesión en localStorage
   */
  static saveSessionData(data: SessionData): void {
    const {
      tableSessionId,
      foodVenueId,
      tableNumber,
      participantCount,
      employments,
    } = data;

    SessionUtils.setStorageValue('tableSessionId', tableSessionId);
    SessionUtils.setStorageValue('foodVenueId', foodVenueId);
    SessionUtils.setStorageValue('tableNumber', tableNumber);
    SessionUtils.setStorageValue('participantCount', participantCount);
    SessionUtils.setStorageValue('employments', JSON.stringify(employments));
  }

  /**
   * Carga todos los datos de autenticación desde localStorage
   */
  static loadAuthData(): LoadedAuthData {
    const employmentString = SessionUtils.getCleanStorageValue('employments');

    return {
      accessToken: SessionUtils.getCleanStorageValue('accessToken'),
      refreshToken: SessionUtils.getCleanStorageValue('refreshToken'),
      expirationDate: SessionUtils.getCleanStorageValue('expirationDate'),
      tableSessionId: SessionUtils.getCleanStorageValue('tableSessionId'),
      foodVenueId: SessionUtils.getCleanStorageValue('foodVenueId'),
      employments: employmentString ? JSON.parse(employmentString) : null,
    };
  }

  /**
   * Extrae información de sesión desde una respuesta de login
   */
  static getSessionInfoFromResponse(
    response: LoginResponse
  ): { tableNumber?: number; participants?: any[] } | null {
    // Si es TableSessionResponse, extraer directamente
    if (SessionUtils.isTableSessionResponse(response)) {
      const tsResponse = response as TableSessionResponse;
      return {
        tableNumber: tsResponse.tableNumber,
        participants: tsResponse.activeParticipants,
      };
    }

    // Si es AuthResponse, intentar extraer del token
    const authResponse = response as AuthResponse;
    const decoded = JwtUtils.decodeJWT(authResponse.accessToken);

    if (decoded?.tableSessionId) {
      return {
        tableNumber: decoded.tableNumber ?? null,
        participants: decoded.participants ?? [],
      };
    }

    return null;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Extrae tableSessionId y foodVenueId del token
   */
  private static extractSessionDataFromToken(accessToken: string): {
    tableSessionId: string | null;
    foodVenueId: string | null;
  } {
    const decoded = JwtUtils.decodeJWT(accessToken);

    if (!decoded) {
      console.error('❌ No se pudo decodificar el token');
      throw new Error('Token inválido');
    }

    const tableSessionId = SessionUtils.cleanSessionValue(
      decoded.tableSessionId
    );
    const foodVenueId = SessionUtils.cleanSessionValue(decoded.foodVenueId);

    console.log('💾 Datos extraídos del token:', {
      tableSessionId,
      foodVenueId,
    });

    return { tableSessionId, foodVenueId };
  }

  public static getEmploymentsFromResponse(
    response: AuthResponse
  ): Employment[] {
    // Lee directamente la propiedad 'employments' del objeto de respuesta.
    console.log("Roles disponibles por empleo: ",
      response?.employments
    );
    return response?.employments || [];
  }

  /**
   * Resuelve el refreshToken con lógica de fallback
   */
  private static resolveRefreshToken(
    responseToken: string | undefined | null,
    fallbackToken: string | null
  ): string {
    // 1. Token de la respuesta (tiene prioridad)
    if (responseToken) {
      console.log('✅ Usando refreshToken de la respuesta');
      return responseToken;
    }

    // 2. Token del fallback (usuario ya logueado)
    const cleanFallback = SessionUtils.cleanSessionValue(fallbackToken);
    if (cleanFallback) {
      console.log('✅ Usando refreshToken del fallback (usuario ya logueado)');
      return cleanFallback;
    }

    // 3. Guest (invitado)
    console.log('👻 Sin refreshToken, usando "guest" (invitado)');
    return 'guest';
  }
}

// ==================== INTERFACES ====================

/**
 * Datos extraídos y procesados desde cualquier respuesta de auth
 * Listo para guardar en localStorage
 */
export interface ProcessedAuthData {
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
  tableSessionId: string | null;
  foodVenueId: string | null;
  tableNumber: number | null;
  participantCount: number | null;
  employments: Employment[];
}

/**
 * Datos de auth cargados desde localStorage
 */
export interface LoadedAuthData {
  accessToken: string | null;
  refreshToken: string | null;
  expirationDate: string | null;
  tableSessionId: string | null;
  foodVenueId: string | null;
  employments: Employment[] | null;
}

/**
 * Datos de sesión para guardar en localStorage
 */
export interface SessionData {
  tableSessionId: string | null;
  foodVenueId: string | null;
  tableNumber?: number | null;
  participantCount?: number | null;
  employments?: Employment[] | null;
}
