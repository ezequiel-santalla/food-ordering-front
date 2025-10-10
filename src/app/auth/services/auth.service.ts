import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { AuthResponse } from '../models/auth.interface';
import { TableSessionRequest, TableSessionResponse } from '../models/table-session';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment.development';
import { SessionUtils } from '../../utils/session-utils';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
type LoginResponse = AuthResponse | TableSessionResponse;

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _authStatus = signal<AuthStatus>('checking');
  private _accessToken = signal<string | null>(SessionUtils.getCleanStorageValue('accessToken'));
  private _refreshToken = signal<string | null>(SessionUtils.getCleanStorageValue('refreshToken'));
  private _expirationDate = signal<string | null>(SessionUtils.getCleanStorageValue('expirationDate'));
  private _tableSessionId = signal<string | null>(SessionUtils.getCleanStorageValue('tableSessionId'));
  private _foodVenueId = signal<string | null>(SessionUtils.getCleanStorageValue('foodVenueId'));

  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    stream: () => this.checkAuthStatus(),
  });

  authStatus = computed(() => {
    const status = this._authStatus();
    if (status === 'checking') return 'Verificando...';
    if (status === 'authenticated') return 'Autenticado';
    return 'No autenticado';
  });

  accessToken = computed<string | null>(() => this._accessToken());
  refreshToken = computed<string | null>(() => this._refreshToken());
  expirationDate = computed<string | null>(() => this._expirationDate());
  tableSessionId = computed<string | null>(() => this._tableSessionId());
  foodVenueId = computed<string | null>(() => this._foodVenueId());
  isAuthenticated = computed(() => this._authStatus() === 'authenticated');

  login(credentials: { email: string, password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${environment.baseUrl}/auth/login`,
      credentials
    ).pipe(
      tap(response => {
        console.log('✅ Login exitoso', response);

        if (this.isTableSessionResponse(response)) {
          console.log('🪑 Login con sesión de mesa activa');
          this.handleTableSessionResponse(response as TableSessionResponse);
        } else {
          console.log('👤 Login sin sesión de mesa');
          this.handleAuthResponse(response as AuthResponse);
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
    const hasValidSession = SessionUtils.isValidSession(currentSessionId);

    if (hasValidSession && !forceChange) {
      console.log('⚠️ Ya tiene sesión activa:', currentSessionId);
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

  checkAuthStatus(): Observable<boolean> {
    const token = SessionUtils.getCleanStorageValue('accessToken');

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

    const refreshToken = SessionUtils.getCleanStorageValue('refreshToken');
    if (refreshToken) {
      this._refreshToken.set(refreshToken);
    }

    // Cargar valores limpios
    const tableSessionId = SessionUtils.getCleanStorageValue('tableSessionId');
    const foodVenueId = SessionUtils.getCleanStorageValue('foodVenueId');

    this._tableSessionId.set(tableSessionId);
    this._foodVenueId.set(foodVenueId);

    // Limpiar localStorage si los valores eran inválidos
    if (!tableSessionId) localStorage.removeItem('tableSessionId');
    if (!foodVenueId) localStorage.removeItem('foodVenueId');

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
    localStorage.removeItem('tableNumber');
    localStorage.removeItem('participantCount');
  }

  // ==================== MÉTODOS PRIVADOS ====================

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
    localStorage.removeItem('tableNumber');
    localStorage.removeItem('participantCount');

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
        this.handleTableSessionResponse(response);
      }),
      catchError(error => {
        console.error('❌ Error escaneando QR:', error);
        throw error;
      })
    );
  }

  private isTableSessionResponse(response: any): response is TableSessionResponse {
    return 'tableNumber' in response && 'participants' in response;
  }

  private handleAuthResponse(authResponse: AuthResponse): void {
    console.log('🔑 Procesando AuthResponse simple');

    this.updateTokens(authResponse.accessToken, authResponse.refreshToken);

    const decoded = this.decodeJWT(authResponse.accessToken);
    console.log('🔍 Token decodificado:', decoded);

    if (decoded) {
      this.updateSessionData(
        SessionUtils.cleanSessionValue(decoded.tableSessionId),
        SessionUtils.cleanSessionValue(decoded.foodVenueId)
      );
    }
  }

  private handleTableSessionResponse(response: TableSessionResponse): void {
    console.log('🪑 Procesando TableSessionResponse');

    this.updateTokens(response.accessToken, response.refreshToken);

    const decoded = this.decodeJWT(response.accessToken);
    console.log('🔍 Token decodificado:', decoded);

    if (decoded) {
      this.updateSessionData(decoded.tableSessionId, decoded.foodVenueId);
    } else {
      console.error('❌ No se pudo decodificar el token');
    }
  }

  private updateTokens(accessToken: string, refreshToken: string): void {
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    this._authStatus.set('authenticated');

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private updateSessionData(tableSessionId: string | null, foodVenueId: string | null): void {
    this._tableSessionId.set(tableSessionId);
    this._foodVenueId.set(foodVenueId); // Asumiendo que tableSessionId es el número de mesa

    if (tableSessionId) {
      localStorage.setItem('tableSessionId', tableSessionId);
      console.log('✅ TableSessionId guardado:', tableSessionId);
    } else {
      localStorage.removeItem('tableSessionId');
      console.log('⚠️ No hay tableSessionId');
    }

    if (foodVenueId) {
      localStorage.setItem('foodVenueId', foodVenueId);
      console.log('✅ FoodVenueId guardado:', foodVenueId);
    } else {
      localStorage.removeItem('foodVenueId');
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
