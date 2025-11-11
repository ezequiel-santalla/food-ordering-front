import { computed, Injectable, signal } from '@angular/core';
import { JwtUtils } from '../../utils/jwt-utils';
import { TokenManager } from '../../utils/token-manager';
import { LoadedAuthData, ProcessedAuthData } from '../../utils/token-manager';
import { SessionUtils } from '../../utils/session-utils';
import { Employment } from '../../shared/models/common';
import { RoleType } from '../../admin-front/models/response/employee';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'guest';

@Injectable({ providedIn: 'root' })
export class AuthStateManager {
  // Signals privadas
  private _authStatus = signal<AuthStatus>('checking');
  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _expirationDate = signal<string | null>(null);
  private _tableSessionId = signal<string | null>(null);
  private _foodVenueId = signal<string | null>(null);
  private _employments = signal<Employment[]>([]);
  private _role = signal<string | null>(null);

  // Computed públicos
  authStatus = computed(() => this._authStatus());
  accessToken = computed(() => this._accessToken());
  refreshToken = computed(() => this._refreshToken());
  expirationDate = computed(() => this._expirationDate());
  tableSessionId = computed(() => this._tableSessionId());
  foodVenueId = computed(() => this._foodVenueId());
  isAuthenticated = computed(() => this._authStatus() === 'authenticated');
  isGuest = computed(() => this._authStatus() === 'guest');
  employments = computed(() => this._employments());
  role = computed(() => this._role());

  participantId = computed<string | null>(() => {
    const token = this._accessToken();
    if (!token) return null;
    return JwtUtils.getClaimValue(token, 'participantId');
  });

  constructor() {
    this.loadFromStorage();
  }

  public isHandlingAuthError = false;

  /**
   * Carga datos desde localStorage y actualiza el estado
   */
  loadFromStorage(): void {
    const data = TokenManager.loadAuthData();
    this.updateState(data);
  }

  private isTokenExpired(expirationDateFromStorage: string | null): boolean {
    const token = this._accessToken();
    if (!token) return true;

    try {
      const decoded = JwtUtils.decodeJWT(token);
      if (!decoded?.exp) return true;
      const expMs = decoded.exp * 1000;
      const now = Date.now();
      const buffer = 10_000;
      return expMs < now + buffer;
    } catch (e) {
      console.error('Error al verificar exp del token', e);
      return true;
    }
  }

  public applyRefresh(accessToken: string, refreshToken?: string) {
    TokenManager.saveTokens(
      accessToken,
      refreshToken ?? this._refreshToken() ?? ''
    );

    const decoded = JwtUtils.decodeJWT(accessToken);
    this._accessToken.set(accessToken);
    if (refreshToken) this._refreshToken.set(refreshToken);

    const expIso = decoded?.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : null;
    this._expirationDate.set(expIso);

    const role =
      decoded?.role ??
      (Array.isArray(decoded?.roles) ? decoded.roles[0] : null);
    this._role.set(role);
    this.updateStatusFromToken(accessToken);
  }

  /**
   * Aplica datos procesados al estado y los guarda
   */
  applyAuthData(data: ProcessedAuthData): void {
    TokenManager.saveTokens(
      data.accessToken,
      data.refreshToken,
      data.expirationDate
    );
    TokenManager.saveSessionData({
      tableSessionId: data.tableSessionId,
      foodVenueId: data.foodVenueId,
      tableNumber: data.tableNumber,
      participantCount: data.participantCount,
    });

    this._accessToken.set(data.accessToken);
    this._refreshToken.set(data.refreshToken);
    this._expirationDate.set(data.expirationDate);
    this._tableSessionId.set(data.tableSessionId);
    this._foodVenueId.set(data.foodVenueId);
    this._employments.set(data.employments || []);

    this.updateStatusFromToken(data.accessToken);
  }

  /**
   * Limpia todo el estado (auth + sesión)
   * Limpia tanto signals como localStorage
   */
  clearState(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._expirationDate.set(null);
    this._tableSessionId.set(null);
    this._foodVenueId.set(null);
    this._authStatus.set('unauthenticated');
    this._employments.set([]);
    this._role.set(null);

    SessionUtils.clearAllAuthData();
  }

  /**
   * Limpia solo la sesión de mesa (mantiene auth)
   * Limpia tanto signals como localStorage
   */
  clearSessionData(): void {
    this._tableSessionId.set(null);
    this._foodVenueId.set(null);

    SessionUtils.clearAllSessionData();
  }

  /**
   * Actualiza el estado desde datos cargados
   */
  private updateState(data: LoadedAuthData): void {
    if (this.isTokenExpired(data.expirationDate) || !data.accessToken) {
      this._accessToken.set(null);
      this._refreshToken.set(null);
      this._expirationDate.set(null);
      this._tableSessionId.set(null);
      this._foodVenueId.set(null);
      this._employments.set([]);
      this._authStatus.set('unauthenticated');
      this._role.set(null);
      return;
    }

    this._accessToken.set(data.accessToken);
    this._refreshToken.set(data.refreshToken);
    this._expirationDate.set(data.expirationDate);
    this._tableSessionId.set(data.tableSessionId);
    this._foodVenueId.set(data.foodVenueId);
    this._employments.set(data.employments || []);

    this.updateStatusFromToken(data.accessToken);
  }

  private updateStatusFromToken(token: string | null): void {
    if (!token) {
      this._authStatus.set('unauthenticated');
      this._role.set(null);
      return;
    }

    try {
      const decoded = JwtUtils.decodeJWT(token);
      if (!decoded) {
        this._authStatus.set('unauthenticated');
        this._role.set(null);
        return;
      }

      const expSec = decoded.exp as number | undefined;
      if (!expSec || expSec * 1000 <= Date.now() + 10_000) {
        
        this._authStatus.set('unauthenticated');
        this._role.set(null);
        return;
      }

      const normalizedRole: string | null =
        (decoded.role as string) ??
        (Array.isArray(decoded.roles) ? (decoded.roles[0] as string) : null);

      this._role.set(normalizedRole);

      switch (normalizedRole) {
        case RoleType.ROLE_GUEST:
          this._authStatus.set('guest');
          break;

        case RoleType.ROLE_CLIENT:
        case RoleType.ROLE_ADMIN:
        case RoleType.ROLE_MANAGER:
        case RoleType.ROLE_STAFF:
        case RoleType.ROLE_ROOT:
          this._authStatus.set('authenticated');
          break;

        default:
          this._authStatus.set('unauthenticated');
          break;
      }
    } catch (error) {
      console.error('Error al parsear token, limpiando estado', error);
      this.clearState();
    }
  }
}
