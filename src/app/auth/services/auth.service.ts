import { computed, inject, Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse, LoginResponse } from '../models/auth';
import { TableSessionResponse } from '../../shared/models/table-session';
import { SessionUtils } from '../../utils/session-utils';
import { JwtUtils } from '../../utils/jwt-utils';
import { TokenManager } from '../../utils/token-manager';
import { AuthStateManager } from './auth-state-manager.service';
import { AuthApiService } from './auth-api.service';

/**
 * Servicio principal de autenticación
 * Coordina entre AuthApiService (HTTP) y AuthStateManager (estado)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private authApi = inject(AuthApiService);
  private authState = inject(AuthStateManager);

  constructor() {
    this.authState.loadFromStorage();
  }

  // Resource para verificación de estado
  checkStatusResource = rxResource({
    stream: () => this.checkAuthStatus(),
  });

  // Exponer computed del state manager
  authStatus = this.authState.authStatus;
  accessToken = this.authState.accessToken;
  refreshToken = this.authState.refreshToken;
  expirationDate = this.authState.expirationDate;
  tableSessionId = this.authState.tableSessionId;
  foodVenueId = this.authState.foodVenueId;
  isAuthenticated = this.authState.isAuthenticated;
  isGuest = this.authState.isGuest;
  participantId = this.authState.participantId;

  // Computed adicional para mostrar info legible
  authStatusText = computed(() => {
    const status = this.authState.authStatus();
    if (status === 'checking') return 'Verificando...';
    if (status === 'authenticated') return 'Autenticado';
    return 'No autenticado';
  });

  /**
   * Login de usuario
   */
  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.authApi.login(credentials).pipe(
      tap(response => {
        const processed = SessionUtils.isTableSessionResponse(response)
          ? TokenManager.processTableSessionResponse(response as TableSessionResponse, this.authState.refreshToken())
          : TokenManager.processAuthResponse(response as AuthResponse);

        this.authState.applyAuthData(processed);
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Registro de usuario
   */
  register(data: any): Observable<LoginResponse> {
    return this.authApi.register(data).pipe(
      tap(response => {
        const processed = SessionUtils.isTableSessionResponse(response)
          ? TokenManager.processTableSessionResponse(response as TableSessionResponse, null)
          : TokenManager.processAuthResponse(response as AuthResponse);

        this.authState.applyAuthData(processed);
      }),
      catchError(error => {
        console.error('❌ Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Escanear QR de mesa
   */
  scanQR(tableId: string, forceChange = false): Observable<TableSessionResponse> {
    const currentSessionId = this.authState.tableSessionId();
    const hasValidSession = SessionUtils.isValidSession(currentSessionId);

    // Si ya tiene sesión y no quiere forzar cambio
    if (hasValidSession && !forceChange) {
      return throwError(() => ({
        status: 409,
        error: { message: 'Ya tienes una sesión activa' }
      }));
    }

    // Si tiene sesión y quiere cambiar, cerrarla primero
    if (hasValidSession && forceChange) {
      return this.closeCurrentSession().pipe(
        switchMap(() => this.performScanQR(tableId))
      );
    }

    return this.performScanQR(tableId);
  }

  /**
   * Verificar estado de autenticación
   */
  checkAuthStatus(): Observable<boolean> {
    const token = SessionUtils.getCleanStorageValue('accessToken');

    if (!token || !JwtUtils.isValidToken(token)) {
      this.logout();
      return of(false);
    }

    this.authState.loadFromStorage();
    return of(true);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authState.clearState();
    SessionUtils.clearAllAuthData();
  }

  /**
   * Obtener info de sesión desde la respuesta de login
   */
  getSessionInfoFromResponse(response: LoginResponse): {
    tableNumber?: number;
    participants?: any[]
  } | null {
    return TokenManager.getSessionInfoFromResponse(response);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private performScanQR(tableId: string): Observable<TableSessionResponse> {
    return this.authApi.scanQR(tableId).pipe(
      tap(response => {
        const processed = TokenManager.processTableSessionResponse(
          response,
          this.authState.refreshToken()
        );
        this.authState.applyAuthData(processed);
      }),
      catchError(error => {
        console.error('❌ Error escaneando QR:', error);
        return throwError(() => error);
      })
    );
  }

  private closeCurrentSession(): Observable<void> {
    this.authState.clearSessionData();
    SessionUtils.clearAllSessionData();
    return of(void 0);
  }
}
