import { TableSessionResponse } from "../shared/models/table-session";

export class SessionUtils {

  private static readonly SESSION_KEYS = [
    'tableSessionId',
    'foodVenueId',
    'tableNumber',
    'participantNickname',
    'participantCount'
  ] as const;

  private static readonly AUTH_KEYS = [
    'accessToken',
    'refreshToken'
  ] as const;

  static isValidSession(sessionId: string | null | undefined): boolean {
    return !!sessionId &&
           sessionId !== 'undefined' &&
           sessionId !== 'null';
  }

  static isTableSessionResponse(response: any): response is TableSessionResponse {
    return (
      'tableNumber' in response &&
      'participants' in response &&
      'startTime' in response &&
      Array.isArray((response as any).participants)
    );
  }

  static cleanSessionValue(value: string | null): string | null {
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }
    return value;
  }

  static getCleanStorageValue(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      return this.cleanSessionValue(value);
    } catch (error) {
      console.error(`Error leyendo localStorage [${key}]:`, error);
      return null;
    }
  }

  static clearAllSessionData(): void {
    this.removeKeys(this.SESSION_KEYS, '🗑️ Datos de sesión limpiados del localStorage');
  }

  static clearAllAuthData(): void {
    const allKeys = [...this.AUTH_KEYS, ...this.SESSION_KEYS];
    this.removeKeys(allKeys, '🗑️ Todos los datos de autenticación limpiados');
  }

  private static removeKeys(keys: readonly string[], successMessage: string): void {
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removiendo ${key} de localStorage:`, error);
      }
    });

    console.log(successMessage);
  }
}
