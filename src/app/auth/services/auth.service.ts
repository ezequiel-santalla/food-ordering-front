import { computed, inject, Injectable } from '@angular/core';
import {
  catchError,
  finalize,
  first,
  map,
  Observable,
  of,
  shareReplay,
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
import { AuthStateManager } from './auth-state-manager.service';
import { AuthApiService } from './auth-api.service';
import { Employment } from '../../shared/models/common';

/**
 * Servicio principal de autenticación
 * Coordina entre AuthApiService (HTTP) y AuthStateManager (estado)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private authApi = inject(AuthApiService);
  private authState = inject(AuthStateManager);

  private isRefreshingToken = false;
  private tokenRefreshed$ = new Subject<string>();

  constructor() {
    this.authState.loadFromStorage();
  }

  checkStatusResource = rxResource({
    stream: () => this.checkAuthStatus(),
  });

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

  authStatusText = computed(() => {
    const status = this.authState.authStatus();
    if (status === 'checking') return 'Verificando...';
    if (status === 'authenticated') return 'Autenticado';
    return 'No autenticado';
  });

  /**
   * Login de usuario
   */
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

  /**
   * Registro de usuario
   */
  register(data: any): Observable<LoginResponse> {
    return this.authApi.register(data).pipe(
      tap((response) => {
        const processed = SessionUtils.isTableSessionResponse(response)
          ? TokenManager.processTableSessionResponse(
              response as TableSessionResponse,
              null
            )
          : TokenManager.processAuthResponse(response as AuthResponse);

        this.authState.applyAuthData(processed);
      }),
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

  /**
   * Escanear QR de mesa
   */
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
   * Cerrar sesión - Llamada al backend + limpieza local
   */
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
  console.log('🚀 performScanQR() ejecutado con tableId=', tableId);
  
  return this.authApi.scanQR(tableId).pipe(
    tap((response) => {
      console.log('✅ Respuesta del backend en scanQR:', response);
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

  private refreshInFlight$?: Observable<string>;

  refreshAccessToken(): Observable<string> {
  
  if (this.refreshInFlight$) {
    return this.refreshInFlight$.pipe(first());
  }

  const currentRefreshToken = this.authState.refreshToken();
  if (!currentRefreshToken || currentRefreshToken === 'guest') {
    this.logoutAndReload();
    return throwError(() => new Error('No hay refresh token válido.'));
  }

  this.refreshInFlight$ = this.authApi.refreshToken(currentRefreshToken).pipe(
    tap((response: AuthResponse) => {
      
      const processed = TokenManager.processAuthResponse(response);

      this.authState.applyAuthData(processed);

      this.tokenRefreshed$.next(response.accessToken);
    }),
    map((response) => response.accessToken),
    catchError((error) => {
      
      this.logoutAndReload();
      return throwError(() => error);
    }),
    finalize(() => {
      // Libera inFlight
      this.refreshInFlight$ = undefined;
    }),
    // Comparte un único refresh para múltiples suscriptores
    shareReplay(1)
  );

  return this.refreshInFlight$;
}
  /**
   * Helper para centralizar el logout + recarga de página.
   */
  logoutAndReload(): void {
    this.logout(); 
    location.reload();
  }
}
