export class JwtUtils {

  /**
   * Decodifica un JWT y retorna su payload
   */
  static decodeJWT(token: string): any {
    if (!token) {
      console.warn('⚠️ Token vacío o undefined');
      return null;
    }

    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        console.error('❌ Token inválido: debe tener 3 partes');
        return null;
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Error decodificando JWT:', error);
      return null;
    }
  }

  /**
   * Verifica si un token decodificado está expirado
   */
  static isTokenExpired(decodedToken: any): boolean {
    // Si no hay token o no tiene exp, considerarlo expirado
    if (!decodedToken || !decodedToken.exp) {
      return true;
    }

    try {
      const expirationDate = new Date(decodedToken.exp * 1000);
      const now = new Date();
      return expirationDate <= now;
    } catch (error) {
      console.error('❌ Error verificando expiración del token:', error);
      return true;
    }
  }

  /**
   * Obtiene un claim específico del token
   */
  static getClaimValue(token: string, claimName: string): any {
    const decoded = this.decodeJWT(token);
    return decoded?.[claimName] ?? null;
  }

  /**
   * Valida si un token es válido (bien formado y no expirado)
   */
  static isValidToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const decoded = this.decodeJWT(token);
    if (!decoded) {
      return false;
    }

    return !this.isTokenExpired(decoded);
  }

  /**
   * Extrae múltiples claims de un token
   */
  static extractClaims(token: string, claimNames: string[]): Record<string, any> {
    const decoded = this.decodeJWT(token);

    if (!decoded) {
      return {};
    }

    return claimNames.reduce((acc, claim) => {
      acc[claim] = decoded[claim] ?? null;
      return acc;
    }, {} as Record<string, any>);
  }
}
