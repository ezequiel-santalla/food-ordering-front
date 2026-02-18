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
import { FoodVenueService } from '../../food-venues/services/food-venue.service';
import { MenuService } from '../../store-front/services/menu-service';
import { CartService } from '../../store-front/services/cart-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authApi = inject(AuthApiService);
  private authState = inject(AuthStateManager);
  private foodVenueService = inject(FoodVenueService);
  private menuService = inject(MenuService);
  private cartService = inject(CartService);

  private isRefreshingToken = false;
  private tokenRefreshed$ = new Subject<string>();
  private pendingTableId: string | null = null;

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

  resendVerificationEmail(email: string): Observable<void> {
    return this.authApi.resendVerificationEmail(email).pipe(
      tap(() => {
        console.log('✅ Email de verificación reenviado');
      }),
      catchError((error) => {
        console.error('❌ Error reenviando email:', error);
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

  resetPassword(recoveryToken: string, newPassword: string): Observable<any> {
    const data = { recoveryToken, newPassword };

    return this.authApi.performPasswordReset(data).pipe(
      catchError((error) => {
        console.error('❌ Error en reseteo de contraseña:', error);
        return throwError(() => error);
      })
    );
  }

  verifyEmail(token: string): Observable<void> {
    return this.authApi.verifyEmail(token).pipe(
      tap(() => {
        console.log('✅ Email verificado');
      }),
      catchError((error) => {
        console.error('❌ Error verificando email:', error);
        return throwError(() => error);
      })
    );
  }

  scanQR(
    tableId: string,
    nickname: string | null = null,
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
        switchMap(() => this.performScanQR(tableId, nickname))
      );
    }

    return this.performScanQR(tableId, nickname);
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

  private performLocalLogout(): void {
    this.authState.clearState();
    this.cartService.clear();
    this.menuService.clearCache();
    this.foodVenueService.clearAll();

    SessionUtils.clearAllAuthData();
    console.log('🗑️ Estado local limpiado');
  }

  getSessionInfoFromResponse(response: LoginResponse): {
    tableNumber?: number;
    activeParticipants?: any[];
    previousParticipants?: any[];
  } | null {
    return TokenManager.getSessionInfoFromResponse(response);
  }

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

  getAvailableEmployments(response: AuthResponse): Employment[] {
    console.log('Buscando empleos disponibles');
    return TokenManager.getEmploymentsFromResponse(response);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private performScanQR(
    tableId: string,
    nickname: string | null = null
  ): Observable<TableSessionResponse> {
    const nicknameOrUndefined = nickname ?? undefined;

    return this.authApi.scanQR(tableId, nicknameOrUndefined).pipe(
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

    this.isRefreshingToken = true;
    const currentRefreshToken = this.authState.refreshToken();

    if (!currentRefreshToken || currentRefreshToken === 'guest') {
      this.isRefreshingToken = false;
      this.logoutAndReload();
      return throwError(() => new Error('No hay refresh token válido.'));
    }

    return this.authApi.refreshToken(currentRefreshToken).pipe(
      tap((response: AuthResponse) => {
        const processed = TokenManager.processAuthResponse(response);
        this.authState.applyAuthData(processed);

        this.tokenRefreshed$.next(response.accessToken);
        this.isRefreshingToken = false;
      }),
      switchMap((response) => {
        return of(response.accessToken);
      }),
      catchError((error) => {

        this.isRefreshingToken = false;
        this.logoutAndReload();
        return throwError(() => error);
      })
    );
  }

  logoutAndReload(): void {
    this.logout();
    location.reload();
  }

  setPendingTableScan(id: string) {
    this.pendingTableId = id;
  }

  consumePendingTableScan(): string | null {
    const id = this.pendingTableId;
    this.pendingTableId = null;
    return id;
  }

  hasPendingTableScan(): boolean {
    return this.pendingTableId !== null;
  }
}
