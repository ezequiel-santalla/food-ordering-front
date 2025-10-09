import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { AuthResponse } from '../models/auth.interface';
import { TableSessionRequest, TableSessionResponse } from '../models/table-session';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment.development';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _authStatus = signal<AuthStatus>('checking');
  private _accessToken = signal<string | null>(localStorage.getItem('accessToken'));
  private _refreshToken = signal<string | null>(localStorage.getItem('refreshToken'));
  private _tableSessionId = signal<string | null>(localStorage.getItem('tableSessionId'));
  private _foodVenueId = signal<string | null>(localStorage.getItem('foodVenueId'));

  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    stream: () => this.checkAuthStatus(),
  });

  authStatus = computed(() => {
    if (this._authStatus() === 'checking') return 'Verificando...';
    if (this._authStatus() === 'authenticated') return 'Autenticado';
    return 'No autenticado';
  });

  accessToken = computed<string | null>(() => this._accessToken());
  refreshToken = computed<string | null>(() => this._refreshToken());
  tableSessionId = computed<string | null>(() => this._tableSessionId());
  foodVenueId = computed<string | null>(() => this._foodVenueId());
  isAuthenticated = computed(() => this._authStatus() === 'authenticated');

  login(credentials: { email: string, password: string }): Observable<{ authResponse: AuthResponse }> {
    return this.http.post<{ authResponse: AuthResponse }>(
      `${environment.baseUrl}/auth/login`,
      credentials
    ).pipe(
      tap(response => {
        console.log('✅ Login exitoso');

        // Primero actualizar el token
        this.handleAuthSuccess(response.authResponse);

        // Luego decodificar y extraer tableSessionId y foodVenueId
        const decoded = this.decodeJWT(response.authResponse.accessToken);
        console.log('🔍 Token decodificado:', decoded);

        if (decoded) {
          // ⚠️ IMPORTANTE: Actualizar ANTES de que los guards se ejecuten
          const tableSessionId = decoded.tableSessionId || null;
          const foodVenueId = decoded.foodVenueId || null;

          this._tableSessionId.set(tableSessionId);
          this._foodVenueId.set(foodVenueId);

          if (tableSessionId) {
            localStorage.setItem('tableSessionId', tableSessionId);
            console.log('✅ TableSessionId guardado:', tableSessionId);
          } else {
            localStorage.removeItem('tableSessionId');
            console.log('⚠️ No hay tableSessionId en el token');
          }

          if (foodVenueId) {
            localStorage.setItem('foodVenueId', foodVenueId);
            console.log('✅ FoodVenueId guardado:', foodVenueId);
          } else {
            localStorage.removeItem('foodVenueId');
          }
        }
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        throw error;
      })
    );
  }

  scanQR(tableId: string, forceChange = false): Observable<TableSessionResponse> {
    const currentSessionId = this._tableSessionId();

    // Validar que no sea un string inválido
    const hasValidSession = currentSessionId &&
      currentSessionId !== 'undefined' &&
      currentSessionId !== 'null';

    if (hasValidSession && !forceChange) {
      console.log('⚠️ Ya tiene sesión activa:', currentSessionId);
      // Lanzar error en lugar de retornar un objeto incompleto
      return throwError(() => ({
        status: 409,
        error: { message: 'Ya tienes una sesión activa' }
      }));
    }

    if (hasValidSession && forceChange) {
      console.log('🔄 Cerrando sesión actual antes de escanear nuevo QR');
      return this.closeCurrentSession().pipe(
        switchMap(() => this.performScanQR(tableId))
      );
    }

    return this.performScanQR(tableId);
  }

  private closeCurrentSession(): Observable<void> {
    const sessionId = this._tableSessionId();

    if (!sessionId) {
      return of(void 0);
    }

    console.log('🚪 Cerrando sesión de mesa:', sessionId);

    this._tableSessionId.set(null);
    this._foodVenueId.set(null);
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('foodVenueId');

    return of(void 0);
  }

  private performScanQR(tableId: string): Observable<TableSessionResponse> {
    const body: TableSessionRequest = { tableId };

    console.log('📱 Escaneando QR:', tableId);

    return this.http.post<TableSessionResponse>(
      `${environment.baseUrl}/table-sessions/scan-qr`,
      body
    ).pipe(
      tap(response => {
        console.log('✅ QR escaneado exitosamente', response);

        // Actualizar token de autenticación
        this.handleAuthSuccess(response.authResponse);

        // Decodificar y actualizar tableSessionId y foodVenueId
        const decoded = this.decodeJWT(response.authResponse.accessToken);
        console.log('🔍 Token decodificado:', decoded);

        if (decoded) {
          this._tableSessionId.set(decoded.tableSessionId);
          this._foodVenueId.set(decoded.foodVenueId);

          localStorage.setItem('tableSessionId', decoded.tableSessionId);
          localStorage.setItem('foodVenueId', decoded.foodVenueId);

          console.log('✅ TableSessionId actualizado:', decoded.tableSessionId);
        } else {
          console.error('❌ No se pudo decodificar el token');
        }
      }),
      catchError(error => {
        console.error('❌ Error escaneando QR:', error);
        throw error;
      })
    );
  }

  checkAuthStatus(): Observable<boolean> {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      this.logout();
      return of(false);
    }

    const decoded = this.decodeJWT(token);

    if (!decoded || this.isTokenExpired(decoded)) {
      this.logout();
      return of(false);
    }

    this._accessToken.set(token);
    this._authStatus.set('authenticated');

    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this._refreshToken.set(refreshToken);
    }

    // Limpiar tableSessionId inválido
    const tableSessionId = localStorage.getItem('tableSessionId');
    if (tableSessionId && tableSessionId !== 'undefined' && tableSessionId !== 'null') {
      this._tableSessionId.set(tableSessionId);
    } else {
      // Limpiar valores inválidos
      this._tableSessionId.set(null);
      localStorage.removeItem('tableSessionId');
    }

    // Limpiar foodVenueId inválido
    const foodVenueId = localStorage.getItem('foodVenueId');
    if (foodVenueId && foodVenueId !== 'undefined' && foodVenueId !== 'null') {
      this._foodVenueId.set(foodVenueId);
    } else {
      // Limpiar valores inválidos
      this._foodVenueId.set(null);
      localStorage.removeItem('foodVenueId');
    }

    return of(true);
  }

  logout() {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._tableSessionId.set(null);
    this._foodVenueId.set(null);
    this._authStatus.set('unauthenticated');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('foodVenueId');
  }

  private handleAuthSuccess(resp: AuthResponse): void {
    this._accessToken.set(resp.accessToken);
    this._authStatus.set('authenticated');
    localStorage.setItem('accessToken', resp.accessToken);

    if (resp.refreshToken) {
      this._refreshToken.set(resp.refreshToken);
      localStorage.setItem('refreshToken', resp.refreshToken);
    }
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch {
      return null;
    }
  }

  private isTokenExpired(decodedToken: any): boolean {
    if (!decodedToken.exp) {
      return false;
    }

    const expirationDate = new Date(decodedToken.exp * 1000);
    const now = new Date();

    return expirationDate <= now;
  }
}
