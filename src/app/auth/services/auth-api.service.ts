import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { LoginResponse } from '../models/auth';
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

  scanQR(tableId: string): Observable<TableSessionResponse> {
    const body: TableSessionRequest = { tableId };
    return this.http.post<TableSessionResponse>(`${this.baseUrl}/table-sessions/scan-qr`, body);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {});
  }
}
