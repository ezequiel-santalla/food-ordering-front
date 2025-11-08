import { computed, Injectable, signal } from '@angular/core';
import { JwtUtils } from '../../utils/jwt-utils';
import { TokenManager } from '../../utils/token-manager';
import { LoadedAuthData, ProcessedAuthData } from '../../utils/token-manager';
import { SessionUtils } from '../../utils/session-utils';
import { Employment } from '../../shared/models/common';

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

  private isTokenExpired(expirationDate: string | null): boolean {
    if (!expirationDate) {
      return true; // Sin fecha de expiración = inválido
    }
    try {
      // Compara la fecha de expiración con la hora actual
      // Damos un búfer de 10 segundos por si acaso
      const expiration = new Date(expirationDate).getTime();
      const now = new Date().getTime();
      const buffer = 10 * 1000; // 10 segundos
      return expiration < now + buffer;
    } catch (error) {
      console.error('Error al parsear fecha de expiración', error);
      return true; // Fecha inválida = inválido
    }
  }

  /**
   * Aplica datos procesados al estado y los guarda
   */
  applyAuthData(data: ProcessedAuthData): void {
    // Guardar en localStorage
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

    // Actualizar estado
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
    // Limpiar signals
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._expirationDate.set(null);
    this._tableSessionId.set(null);
    this._foodVenueId.set(null);
    this._authStatus.set('unauthenticated');
    this._employments.set([]);
    this._role.set(null);

    // Limpiar localStorage
    SessionUtils.clearAllAuthData();
  }

  /**
   * Limpia solo la sesión de mesa (mantiene auth)
   * Limpia tanto signals como localStorage
   */
  clearSessionData(): void {
    // Limpiar signals
    this._tableSessionId.set(null);
    this._foodVenueId.set(null);

    // Limpiar localStorage
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
      const role = JwtUtils.getClaimValue(token, 'role') as string | null;
      this._role.set(role);

      switch (role) {
        case 'ROLE_CLIENT':
          this._authStatus.set('authenticated');
          break;
        case 'ROLE_GUEST':
          this._authStatus.set('guest');
          break;
        default:
          this._authStatus.set('unauthenticated');
      }
    } catch (error) {
      console.error('Error al parsear token, limpiando estado', error);
      this.clearState();
    }
  }
}
