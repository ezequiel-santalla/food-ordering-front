import { AuthResponse } from '../auth/models/auth';
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

    const decoded = JwtUtils.decodeJWT(authResponse.accessToken);

    if (!decoded) {
      console.error('❌ No se pudo decodificar el token en AuthResponse');
      throw new Error('Token inválido en AuthResponse');
    }

    const tableSessionId = SessionUtils.cleanSessionValue(decoded.tableSessionId);
    const foodVenueId = SessionUtils.cleanSessionValue(decoded.foodVenueId);

    console.log('💾 Datos extraídos del AuthResponse:', {
      tableSessionId,
      foodVenueId,
    });

    return {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      tableSessionId,
      foodVenueId,
      tableNumber: null,
      participantCount: null
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

    // Prioridad: refreshToken de la respuesta, luego fallback, luego 'guest'
    let finalRefreshToken: string;

    if (response.refreshToken) {
      finalRefreshToken = response.refreshToken;
      console.log('✅ Usando refreshToken de la respuesta');
    } else if (fallbackRefreshToken && fallbackRefreshToken !== 'null' && fallbackRefreshToken !== 'undefined') {
      finalRefreshToken = fallbackRefreshToken;
      console.log('✅ Usando refreshToken del fallback (usuario ya logueado)');
    } else {
      finalRefreshToken = 'guest';
      console.log('👻 Sin refreshToken, usando "guest" (invitado)');
    }

    console.log('🔍 RefreshToken final:', {
      fromResponse: response.refreshToken || null,
      fromFallback: fallbackRefreshToken || null,
      final: finalRefreshToken,
      isGuest: finalRefreshToken === 'guest'
    });

    const decoded = JwtUtils.decodeJWT(response.accessToken);

    if (!decoded) {
      console.error('❌ No se pudo decodificar el token en TableSessionResponse');
      throw new Error('Token inválido en TableSessionResponse');
    }

    const tableSessionId = SessionUtils.cleanSessionValue(decoded.tableSessionId);
    const foodVenueId = SessionUtils.cleanSessionValue(decoded.foodVenueId);

    return {
      accessToken: response.accessToken,
      refreshToken: finalRefreshToken,
      tableSessionId,
      foodVenueId,
      tableNumber: response.tableNumber || null,
      participantCount: response.participants?.length || null
    };
  }

  /**
   * Valida que los tokens sean válidos antes de guardarlos
   */
  static validateTokens(accessToken: string, refreshToken: string): void {
    if (!accessToken) {
      console.error('❌ AccessToken inválido');
      throw new Error('AccessToken inválido recibido del servidor');
    }

    // Para invitados (refreshToken = 'guest'), solo validar accessToken
    if (refreshToken !== 'guest' && !refreshToken) {
      console.error('❌ RefreshToken inválido');
      throw new Error('RefreshToken inválido recibido del servidor');
    }

    if (!JwtUtils.isValidToken(accessToken)) {
      console.error('❌ AccessToken inválido o expirado');
      throw new Error('AccessToken inválido');
    }

    console.log('✅ Tokens validados correctamente', {
      isGuest: refreshToken === 'guest'
    });
  }

  /**
   * Guarda tokens en localStorage
   */
  static saveTokens(accessToken: string, refreshToken: string): void {
    this.validateTokens(accessToken, refreshToken);

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    console.log('✅ Tokens guardados en localStorage correctamente', {
      isGuest: refreshToken === 'guest'
    });
  }

  /**
   * Guarda datos de sesión en localStorage
   */
  static saveSessionData(data: {
    tableSessionId: string | null;
    foodVenueId: string | null;
    tableNumber?: number | null;
    participantCount?: number | null;
  }): void {
    const { tableSessionId, foodVenueId, tableNumber, participantCount } = data;

    // Guardar tableSessionId
    if (tableSessionId && tableSessionId.trim()) {
      localStorage.setItem('tableSessionId', tableSessionId);
      console.log('✅ TableSessionId guardado:', tableSessionId);
    } else {
      localStorage.removeItem('tableSessionId');
      console.log('⚠️ No hay tableSessionId válido para guardar');
    }

    // Guardar foodVenueId
    if (foodVenueId && foodVenueId.trim()) {
      localStorage.setItem('foodVenueId', foodVenueId);
      console.log('✅ FoodVenueId guardado:', foodVenueId);
    } else {
      localStorage.removeItem('foodVenueId');
      console.log('⚠️ No hay foodVenueId válido para guardar');
    }

    // Guardar tableNumber (opcional)
    if (tableNumber !== null && tableNumber !== undefined && tableNumber > 0) {
      localStorage.setItem('tableNumber', tableNumber.toString());
      console.log('✅ TableNumber guardado:', tableNumber);
    }

    // Guardar participantCount (opcional)
    if (participantCount !== null && participantCount !== undefined && participantCount >= 0) {
      localStorage.setItem('participantCount', participantCount.toString());
      console.log('✅ ParticipantCount guardado:', participantCount);
    }
  }

  /**
   * Carga todos los datos de autenticación desde localStorage
   */
  static loadAuthData(): LoadedAuthData {
    return {
      accessToken: SessionUtils.getCleanStorageValue('accessToken'),
      refreshToken: SessionUtils.getCleanStorageValue('refreshToken'),
      tableSessionId: SessionUtils.getCleanStorageValue('tableSessionId'),
      foodVenueId: SessionUtils.getCleanStorageValue('foodVenueId'),
      expirationDate: SessionUtils.getCleanStorageValue('expirationDate')
    };
  }
}

/**
 * Datos procesados de autenticación listos para ser guardados
 */
export interface ProcessedAuthData {
  accessToken: string;
  refreshToken: string;
  tableSessionId: string | null;
  foodVenueId: string | null;
  tableNumber: number | null;
  participantCount: number | null;
}

/**
 * Datos de autenticación cargados desde localStorage
 */
export interface LoadedAuthData {
  accessToken: string | null;
  refreshToken: string | null;
  tableSessionId: string | null;
  foodVenueId: string | null;
  expirationDate: string | null;
}
