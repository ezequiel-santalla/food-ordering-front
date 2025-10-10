export class SessionUtils {

  static isValidSession(sessionId: string | null | undefined): boolean {
    return !!sessionId &&
           sessionId !== 'undefined' &&
           sessionId !== 'null';
  }

  static cleanSessionValue(value: string | null): string | null {
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }
    return value;
  }

  static getCleanStorageValue(key: string): string | null {
    const value = localStorage.getItem(key);
    return this.cleanSessionValue(value);
  }
}
