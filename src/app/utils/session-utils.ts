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
    'refreshToken',
    'expirationDate'
  ] as const;

  /**
   * Valida si un sessionId es válido
   */
  static isValidSession(sessionId: string | null | undefined): boolean {
    return !!sessionId &&
           sessionId !== 'undefined' &&
           sessionId !== 'null';
  }

  /**
   * Type guard para TableSessionResponse
   */
  static isTableSessionResponse(response: any): response is TableSessionResponse {
    return response &&
           typeof response === 'object' &&
           'tableNumber' in response &&
           'participants' in response &&
           'startTime' in response &&
           Array.isArray(response.participants);
  }

  /**
   * Limpia valores inválidos (undefined, null como string)
   */
  static cleanSessionValue(value: string | null | undefined): string | null {
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }
    return value.trim(); // Agregar trim por si hay espacios
  }

  /**
   * Lee un valor del localStorage y lo limpia
   */
  static getCleanStorageValue(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      return this.cleanSessionValue(value);
    } catch (error) {
      console.error(`❌ Error leyendo localStorage [${key}]:`, error);
      return null;
    }
  }

  /**
   * Guarda un valor en localStorage solo si es válido
   */
  static setStorageValue(key: string, value: string | number | null | undefined): void {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
        return;
      }

      const stringValue = String(value);
      const cleanValue = this.cleanSessionValue(stringValue);

      if (cleanValue) {
        localStorage.setItem(key, cleanValue);
        console.log(`✅ ${key} guardado:`, cleanValue);
      } else {
        localStorage.removeItem(key);
        console.log(`⚠️ ${key} removido (valor inválido)`);
      }
    } catch (error) {
      console.error(`❌ Error guardando localStorage [${key}]:`, error);
    }
  }

  /**
   * Limpia solo los datos de sesión (no tokens)
   */
  static clearAllSessionData(): void {
    this.removeKeys(this.SESSION_KEYS);
    console.log('🗑️ Datos de sesión limpiados del localStorage');
  }

  /**
   * Limpia todos los datos de autenticación (tokens + sesión)
   */
  static clearAllAuthData(): void {
    const allKeys = [...this.AUTH_KEYS, ...this.SESSION_KEYS];
    this.removeKeys(allKeys);
    console.log('🗑️ Todos los datos de autenticación limpiados');
  }

  /**
   * Remueve múltiples keys del localStorage
   */
  private static removeKeys(keys: readonly string[]): void {
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`❌ Error removiendo ${key}:`, error);
      }
    });
  }

  /**
   * Obtiene todos los datos de autenticación del localStorage
   */
  static getAllAuthData(): Record<string, string | null> {
    const allKeys = [...this.AUTH_KEYS, ...this.SESSION_KEYS];
    return allKeys.reduce((acc, key) => {
      acc[key] = this.getCleanStorageValue(key);
      return acc;
    }, {} as Record<string, string | null>);
  }
}
