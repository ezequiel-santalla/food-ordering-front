import { TableSessionResponse } from "../shared/models/table-session";

export class SessionUtils {

  private static readonly SESSION_KEYS = [
    'tableSessionId',
    'foodVenueId',
    'tableNumber',
    'participantNickname',
    'participantCount',
    'cart'
  ] as const;

  private static readonly AUTH_KEYS = [
    'accessToken',
    'refreshToken',
    'expirationDate'
  ] as const;

  static isValidSession(sessionId: string | null | undefined): boolean {
    return !!sessionId &&
           sessionId !== 'undefined' &&
           sessionId !== 'null';
  }

  static isTableSessionResponse(response: any): response is TableSessionResponse {
    return response &&
           typeof response === 'object' &&
           'tableNumber' in response &&
           'activeParticipants' in response &&
           'previousParticipants' in response &&
           'startTime' in response &&
           Array.isArray(response.activeParticipantsparticipants);
  }

  static cleanSessionValue(value: string | null | undefined): string | null {
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }
    return value.trim();
  }

  static getCleanStorageValue(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      return this.cleanSessionValue(value);
    } catch (error) {
      console.error(`❌ Error leyendo localStorage [${key}]:`, error);
      return null;
    }
  }

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
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`❌ Error guardando localStorage [${key}]:`, error);
    }
  }

  static clearAllSessionData(): void {
    this.removeKeys(this.SESSION_KEYS);
  }

  static clearAllAuthData(): void {
    const allKeys = [...this.AUTH_KEYS, ...this.SESSION_KEYS];
    this.removeKeys(allKeys);
  }

  private static removeKeys(keys: readonly string[]): void {
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`❌ Error removiendo ${key}:`, error);
      }
    });
  }

  static getAllAuthData(): Record<string, string | null> {
    const allKeys = [...this.AUTH_KEYS, ...this.SESSION_KEYS];
    return allKeys.reduce((acc, key) => {
      acc[key] = this.getCleanStorageValue(key);
      return acc;
    }, {} as Record<string, string | null>);
  }

  public static getStorageObject<T>(key: string): T | null {
    const data = this.getCleanStorageValue(key);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error al parsear el objeto ${key} de localStorage`, e);
      return null;
    }
  }
}
