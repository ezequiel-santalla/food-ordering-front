import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AuthResponse } from '../models/auth.interface';
import { TableSessionRequest, TableSessionResponse } from '../models/table-session';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment.development';
import { TableSessionService } from '../../store-front/services/table-session.service';

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

  login(credentials: { email: string, password: string }): Observable<{ authResponse: AuthResponse }> {
    return this.http.post<{ authResponse: AuthResponse }>(`${environment.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response.authResponse))
      );
  }

  // auth.service.ts
  scanQR(tableId: string): Observable<TableSessionResponse> {
    const body: TableSessionRequest = { tableId };

    return this.http.post<TableSessionResponse>(
      `${environment.baseUrl}/table-sessions/scan-qr`,
      body
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response.authResponse);

        const decoded = this.decodeJWT(response.authResponse.accessToken);
        if (decoded) {
          this._tableSessionId.set(decoded.tableSessionId);
          this._foodVenueId.set(decoded.foodVenueId);

          localStorage.setItem('tableSessionId', decoded.tableSessionId);
          localStorage.setItem('foodVenueId', decoded.foodVenueId);
        }
      })
    );
  }

  checkAuthStatus(): Observable<boolean> {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http.get<{ authResponse: AuthResponse }>(`${environment.baseUrl}/auth/check-status`)
      .pipe(
        map(resp => this.handleAuthSuccess(resp.authResponse)),
        catchError((error: any) => this.handleAuthError(error))
      );
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

  inject(TableSessionService).clearSession();
}

  private handleAuthSuccess(resp: AuthResponse): boolean {
    this._accessToken.set(resp.accessToken);
    this._authStatus.set('authenticated');
    localStorage.setItem('accessToken', resp.accessToken);

    if (resp.refreshToken) {
      this._refreshToken.set(resp.refreshToken);
      localStorage.setItem('refreshToken', resp.refreshToken);
    }

    return true;
  }

  private handleAuthError(error: any): Observable<boolean> {
    this.logout();
    return of(false);
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
}
