export class JwtUtils {

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

  static isTokenExpired(decodedToken: any): boolean {
    if (!decodedToken || !decodedToken.exp) {
      return false;
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

  static getClaimValue(token: string, claimName: string): any {
    const decoded = this.decodeJWT(token);
    if (!decoded) return null;
    return decoded[claimName] || null;
  }

  static isValidToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const decoded = this.decodeJWT(token);
    if (!decoded) {
      return false;
    }

    if (this.isTokenExpired(decoded)) {
      return false;
    }

    return true;
  }

  static extractClaims(token: string, claimNames: string[]): Record<string, any> {
    const decoded = this.decodeJWT(token);
    const result: Record<string, any> = {};

    if (!decoded) {
      return result;
    }

    claimNames.forEach(claim => {
      result[claim] = decoded[claim] || null;
    });

    return result;
  }
}
