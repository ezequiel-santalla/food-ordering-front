import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { AuthResponse } from '../models/auth';
import { TableSessionRequest, TableSessionResponse } from '../../shared/models/table-session';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment.development';
import { SessionUtils } from '../../utils/session-utils';
import { JwtUtils } from '../../utils/jwt-utils';
import { TokenManager } from '../../utils/token-manager';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
type LoginResponse = AuthResponse | TableSessionResponse;

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _authStatus = signal<AuthStatus>('checking');
  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _expirationDate = signal<string | null>(null);
  private _tableSessionId = signal<string | null>(null);
  private _foodVenueId = signal<string | null>(null);

  private http = inject(HttpClient);

  constructor() {
    this.loadStoredAuthData();
  }

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

  participantId = computed<string | null>(() => {
    const token = this._accessToken();
    if (!token) return null;
    return JwtUtils.getClaimValue(token, 'participantId') || null;
  });

  login(credentials: { email: string, password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${environment.baseUrl}/auth/login`,
      credentials
    ).pipe(
      tap(response => {
        console.log('✅ Login exitoso', response);

        if (SessionUtils.isTableSessionResponse(response)) {
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

  getSessionInfoFromResponse(response: LoginResponse): {
    tableNumber?: number;
    participants?: any[]
  } | null {
    if (SessionUtils.isTableSessionResponse(response)) {
      return {
        tableNumber: (response as TableSessionResponse).tableNumber,
        participants: (response as TableSessionResponse).participants
      };
    }

    const decoded = JwtUtils.decodeJWT((response as AuthResponse).accessToken);
    if (decoded?.tableSessionId) {
      return {
        tableNumber: decoded.tableNumber || null,
        participants: decoded.participants || []
      };
    }

    return null;
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

    if (!JwtUtils.isValidToken(token)) {
      this.logout();
      return of(false);
    }

    // Recargar todos los datos desde localStorage
    this.loadStoredAuthData();
    this._authStatus.set('authenticated');

    return of(true);
  }

  logout() {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._tableSessionId.set(null);
    this._foodVenueId.set(null);
    this._authStatus.set('unauthenticated');

    SessionUtils.clearAllAuthData();
  }

  private loadStoredAuthData(): void {
    const data = TokenManager.loadAuthData();

    this._accessToken.set(data.accessToken);
    this._refreshToken.set(data.refreshToken);
    this._tableSessionId.set(data.tableSessionId);
    this._foodVenueId.set(data.foodVenueId);
    this._expirationDate.set(data.expirationDate);

    console.log('📂 Datos cargados desde localStorage:', {
      hasAccessToken: !!data.accessToken,
      hasRefreshToken: !!data.refreshToken,
      refreshToken: data.refreshToken,
      tableSessionId: data.tableSessionId,
      isAuthenticated: !!data.accessToken && !!data.refreshToken
    });
  }

  private closeCurrentSession(): Observable<void> {
    const sessionId = this._tableSessionId();

    if (!sessionId) {
      return of(void 0);
    }

    console.log('🚪 Cerrando sesión de mesa:', sessionId);

    this._tableSessionId.set(null);
    this._foodVenueId.set(null);
    SessionUtils.clearAllSessionData();

    return of(void 0);
  }

  private performScanQR(tableId: string): Observable<TableSessionResponse> {
    const body: TableSessionRequest = { tableId };

    console.log('📱 Escaneando QR con estado actual:', {
      tableId,
      isAuthenticated: this.isAuthenticated(),
      hasRefreshToken: !!this._refreshToken(),
      refreshToken: this._refreshToken()
    });

    return this.http.post<TableSessionResponse>(
      `${environment.baseUrl}/table-sessions/scan-qr`,
      body
    ).pipe(
      tap(response => {
        console.log('✅ QR escaneado exitosamente', response);
        console.log('🔍 RefreshToken en respuesta:', response.refreshToken);

        // IMPORTANTE: Pasar el refreshToken actual al procesador
        this.handleTableSessionResponse(response, this._refreshToken());
      }),
      catchError(error => {
        console.error('❌ Error escaneando QR:', error);
        throw error;
      })
    );
  }

  private handleAuthResponse(authResponse: AuthResponse): void {
    const processed = TokenManager.processAuthResponse(authResponse);
    this.applyAuthData(processed);
  }

  private handleTableSessionResponse(
    response: TableSessionResponse,
    currentRefreshToken: string | null = null
  ): void {
    // Usar el refreshToken actual del estado si existe
    const fallbackRefreshToken = currentRefreshToken || this._refreshToken();

    console.log('🔄 Procesando TableSessionResponse con fallback:', {
      responseHasRefreshToken: !!response.refreshToken,
      currentRefreshToken: fallbackRefreshToken,
      willBeGuest: !response.refreshToken && !fallbackRefreshToken
    });

    const processed = TokenManager.processTableSessionResponse(
      response,
      fallbackRefreshToken
    );

    this.applyAuthData(processed);
  }

  private applyAuthData(data: {
    accessToken: string;
    refreshToken: string;
    tableSessionId: string | null;
    foodVenueId: string | null;
    tableNumber: number | null;
    participantCount: number | null;
  }): void {
    console.log('💾 Aplicando datos de autenticación:', {
      hasAccessToken: !!data.accessToken,
      refreshToken: data.refreshToken,
      isGuest: data.refreshToken === 'guest',
      tableSessionId: data.tableSessionId
    });

    // Guardar tokens
    TokenManager.saveTokens(data.accessToken, data.refreshToken);

    // Guardar datos de sesión
    TokenManager.saveSessionData({
      tableSessionId: data.tableSessionId,
      foodVenueId: data.foodVenueId,
      tableNumber: data.tableNumber,
      participantCount: data.participantCount
    });

    // Actualizar signals
    this._accessToken.set(data.accessToken);
    this._refreshToken.set(data.refreshToken);
    this._tableSessionId.set(data.tableSessionId);
    this._foodVenueId.set(data.foodVenueId);
    this._authStatus.set('authenticated');

    console.log('✅ Datos de autenticación aplicados correctamente');
  }
}
