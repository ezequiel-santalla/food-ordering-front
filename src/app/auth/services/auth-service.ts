import { computed, inject, Injectable } from '@angular/core';
import {
  catchError,
  first,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse, LoginResponse } from '../models/auth';
import { TableSessionResponse } from '../../shared/models/table-session';
import { SessionUtils } from '../../utils/session-utils';
import { JwtUtils } from '../../utils/jwt-utils';
import { TokenManager } from '../../utils/token-manager';
import { AuthStateManager } from './auth-state-manager-service';
import { AuthApiService } from './auth-api-service';
import { Employment } from '../../shared/models/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authApi = inject(AuthApiService);
  private authState = inject(AuthStateManager);

  private isRefreshingToken = false;
  private tokenRefreshed$ = new Subject<string>();

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
  employments = this.authState.employments;

  // Computed adicional para mostrar info legible
  authStatusText = computed(() => {
    const status = this.authState.authStatus();
    if (status === 'checking') return 'Verificando...';
    if (status === 'authenticated') return 'Autenticado';
    return 'No autenticado';
  });

  login(
    credentials: {
      email: string;
      password: string;
    },
    initialTableSessionId: string | null = null
  ): Observable<LoginResponse> {
    const loginPayload = {
      ...credentials,
      currentSessionId: initialTableSessionId,
    };

    return this.authApi.login(loginPayload).pipe(
      tap((response) => {
        const processed = SessionUtils.isTableSessionResponse(response)
          ? TokenManager.processTableSessionResponse(
            response as TableSessionResponse,
            this.authState.refreshToken()
          )
          : TokenManager.processAuthResponse(response as AuthResponse);

        this.authState.applyAuthData(processed);
      }),
      catchError((error) => {
        console.error('❌ Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  register(data: any): Observable<LoginResponse> {
    return this.authApi.register(data).pipe(
      catchError((error) => {
        console.error('❌ Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(data: any): Observable<LoginResponse> {
    return this.authApi.requestPasswordReset(data).pipe(
      catchError((error) => {
        console.error('❌ Error en solicitud de reseteo:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(token: string, password: string): Observable<any> {
    const data = { token, password };

    return this.authApi.performPasswordReset(data).pipe(
      catchError((error) => {
        console.error('❌ Error en reseteo de contraseña:', error);
        return throwError(() => error);
      })
    );
  }

  scanQR(
    tableId: string,
    forceChange = false
  ): Observable<TableSessionResponse> {
    const currentSessionId = this.authState.tableSessionId();
    const hasValidSession = SessionUtils.isValidSession(currentSessionId);

    if (hasValidSession && !forceChange) {
      return throwError(() => ({
        status: 409,
        error: { message: 'Ya tienes una sesión activa' },
      }));
    }

    if (hasValidSession && forceChange) {
      return this.closeCurrentSession().pipe(
        switchMap(() => this.performScanQR(tableId))
      );
    }

    return this.performScanQR(tableId);
  }

  checkAuthStatus(): Observable<boolean> {
    const token = SessionUtils.getCleanStorageValue('accessToken');

    if (!token || !JwtUtils.isValidToken(token)) {
      this.logout();
      return of(false);
    }

    this.authState.loadFromStorage();
    return of(true);
  }

  logout(): Observable<void> {
    const refreshToken = this.authState.refreshToken();

    return this.authApi.logout(refreshToken).pipe(
      tap(() => {
        console.log('✅ Logout exitoso en el backend');
        this.performLocalLogout();
      }),
      catchError((error) => {
        console.error(
          '⚠️ Error en logout del backend, realizando logout local:',
          error
        );

        this.performLocalLogout();
        return of(void 0);
      })
    );
  }

  /**
   * Limpieza local del logout (sin llamada al backend)
   * Usado internamente cuando la comunicación con backend falla
   */
  private performLocalLogout(): void {
    this.authState.clearState();
    SessionUtils.clearAllAuthData();
    console.log('🗑️ Estado local limpiado');
  }

  /**
   * Obtener info de sesión desde la respuesta de login
   */
  getSessionInfoFromResponse(response: LoginResponse): {
    tableNumber?: number;
    activeParticipants?: any[];
    previousParticipants?: any[];
  } | null {
    return TokenManager.getSessionInfoFromResponse(response);
  }

  /**
   * Selecciona un rol de empleado (Admin, Staff, etc.) llamando a la API.
   * @param employmentId El ID público del rol a seleccionar.
   */
  selectRole(employmentId: string): Observable<LoginResponse> {
    const currentEmployments = this.authState.employments();
    return this.authApi.selectRole(employmentId).pipe(
      tap((response) => {
        // La API devuelve un nuevo token, así que lo procesamos y actualizamos todo el estado.
        const processed = TokenManager.processAuthResponse(
          response as AuthResponse
        );
        processed.employments = currentEmployments;
        this.authState.applyAuthData(processed);
      }),
      catchError((error) => {
        console.error('❌ Error al seleccionar el rol:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener los roles disponibles desde la respuesta de login
   */
  getAvailableEmployments(response: AuthResponse): Employment[] {
    console.log('Buscando empleos disponibles');
    return TokenManager.getEmploymentsFromResponse(response);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private performScanQR(tableId: string): Observable<TableSessionResponse> {
    return this.authApi.scanQR(tableId).pipe(
      tap((response) => {
        const processed = TokenManager.processTableSessionResponse(
          response,
          this.authState.refreshToken()
        );
        this.authState.applyAuthData(processed);
      }),
      catchError((error) => {
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

  refreshAccessToken(): Observable<string> {
    if (this.isRefreshingToken) {
      // Si ya hay un refresco en progreso,
      // las otras peticiones "esperan" hasta que termine.
      return this.tokenRefreshed$.pipe(first());
    }

    // Iniciar el proceso de refresco
    this.isRefreshingToken = true;
    const currentRefreshToken = this.authState.refreshToken();

    if (!currentRefreshToken || currentRefreshToken === 'guest') {
      this.isRefreshingToken = false;
      this.logoutAndReload();
      return throwError(() => new Error('No hay refresh token válido.'));
    }

    // Llamar al API Service
    return this.authApi.refreshToken(currentRefreshToken).pipe(
      tap((response: AuthResponse) => {
        // 1. Guardar los nuevos tokens
        const processed = TokenManager.processAuthResponse(response);
        this.authState.applyAuthData(processed);

        // 2. Avisar a las peticiones en espera que tenemos un nuevo token
        this.tokenRefreshed$.next(response.accessToken);
        this.isRefreshingToken = false;
      }),
      switchMap((response) => {
        // 3. Devolver un Observable con el nuevo access token
        return of(response.accessToken);
      }),
      catchError((error) => {
        // 4. ¡El refresh token falló! (ej. también expiró o fue revocado)
        // No hay nada que hacer. Cierra la sesión.
        this.isRefreshingToken = false;
        this.logoutAndReload();
        return throwError(() => error);
      })
    );
  }

  /**
   * Helper para centralizar el logout + recarga de página.
   */
  logoutAndReload(): void {
    this.logout();
    location.reload();
  }
}
