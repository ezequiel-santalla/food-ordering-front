import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthResponse, LoginResponse } from '../models/auth';
import { TableSessionRequest, TableSessionResponse } from '../../shared/models/table-session';

@Injectable({ providedIn: 'root' })
export class AuthApiService {

  private http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials);
  }

  register(data: any): Observable<LoginResponse> {
    return this.http.post<any>(`${this.baseUrl}/auth/register`, data).pipe(
      switchMap(() => {
        return this.login({
          email: data.email,
          password: data.password
        });
      })
    );
  }

  requestPasswordReset(data: { email: string }): Observable<any> {
    const url = `${this.baseUrl}/auth/forgot-password`; 
    return this.http.post<any>(url, data);
  }

  performPasswordReset(data: { token: string, password: string }): Observable<any> {
    // Asegúrate que esta sea la URL correcta de tu backend
    const url = `${this.baseUrl}/reset-password`; 
    
    // Enviamos { token: "...", password: "..." } como JSON
    return this.http.post<any>(url, data);
  }

  scanQR(tableId: string): Observable<TableSessionResponse> {
    const body: TableSessionRequest = { tableId };
    return this.http.post<TableSessionResponse>(`${this.baseUrl}/table-sessions/scan-qr`, body);
  }

  logout(refreshToken: string | null): Observable<void> {
    if (!refreshToken) {
      return of(void 0);
    }

    const body: any = { refreshToken };
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, body);
  }

  refreshToken(token: string): Observable<AuthResponse> {
    // Asegúrate que esta sea la URL correcta de tu backend
    const url = `${this.baseUrl}/refresh-token`; 
    
    // El backend espera el refresh token en el body
    return this.http.post<AuthResponse>(url, { refreshToken: token });
  }
  
  selectRole(employmentId: string): Observable<LoginResponse> {
    const body = { employmentId };
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/switch-roles/select`, body);
  }
}
