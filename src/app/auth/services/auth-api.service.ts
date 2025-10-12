import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthResponse } from '../models/auth';
import { TableSessionRequest, TableSessionResponse } from '../../shared/models/table-session';

/**
 * Servicio que maneja las llamadas HTTP de autenticación
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {

  private http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  login(credentials: { email: string; password: string }): Observable<AuthResponse | TableSessionResponse> {
    return this.http.post<AuthResponse | TableSessionResponse>(`${this.baseUrl}/auth/login`, credentials);
  }

  register(data: { email: string; password: string; name: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, data);
  }

  scanQR(tableId: string): Observable<TableSessionResponse> {
    const body: TableSessionRequest = { tableId };

    return this.http.post<TableSessionResponse>(`${this.baseUrl}/table-sessions/scan-qr`, body);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {});
  }
}
