import { computed, Injectable, signal } from '@angular/core';
import { JwtUtils } from '../../utils/jwt-utils';
import { TokenManager } from '../../utils/token-manager';
import { LoadedAuthData, ProcessedAuthData } from '../../utils/token-manager';
import { SessionUtils } from '../../utils/session-utils';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class AuthStateManager {

  // Signals privadas
  private _authStatus = signal<AuthStatus>('checking');
  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _expirationDate = signal<string | null>(null);
  private _tableSessionId = signal<string | null>(null);
  private _foodVenueId = signal<string | null>(null);

  // Computed públicos
  authStatus = computed(() => this._authStatus());
  accessToken = computed(() => this._accessToken());
  refreshToken = computed(() => this._refreshToken());
  expirationDate = computed(() => this._expirationDate());
  tableSessionId = computed(() => this._tableSessionId());
  foodVenueId = computed(() => this._foodVenueId());
  isAuthenticated = computed(() => this._authStatus() === 'authenticated');
  isGuest = computed(() => this._refreshToken() === 'guest');

  participantId = computed<string | null>(() => {
    const token = this._accessToken();
    if (!token) return null;
    return JwtUtils.getClaimValue(token, 'participantId');
  });

  /**
   * Carga datos desde localStorage y actualiza el estado
   */
  loadFromStorage(): void {
    const data = TokenManager.loadAuthData();
    this.updateState(data);
  }

  /**
   * Aplica datos procesados al estado y los guarda
   */
  applyAuthData(data: ProcessedAuthData): void {
    // Guardar en localStorage
    TokenManager.saveTokens(data.accessToken, data.refreshToken, data.expirationDate);
    TokenManager.saveSessionData({
      tableSessionId: data.tableSessionId,
      foodVenueId: data.foodVenueId,
      tableNumber: data.tableNumber,
      participantCount: data.participantCount
    });

    // Actualizar estado
    this._accessToken.set(data.accessToken);
    this._refreshToken.set(data.refreshToken);
    this._expirationDate.set(data.expirationDate);
    this._tableSessionId.set(data.tableSessionId);
    this._foodVenueId.set(data.foodVenueId);
    this._authStatus.set('authenticated');
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
    this._accessToken.set(data.accessToken);
    this._refreshToken.set(data.refreshToken);
    this._expirationDate.set(data.expirationDate);
    this._tableSessionId.set(data.tableSessionId);
    this._foodVenueId.set(data.foodVenueId);

    // Determinar estado de autenticación
    if (data.accessToken && data.refreshToken) {
      this._authStatus.set('authenticated');
    } else {
      this._authStatus.set('unauthenticated');
    }
  }
}
