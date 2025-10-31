import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

const API_URL = `${environment.baseUrl}/invitations`;

export interface InvitationResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmploymentInvitationService {
  private http = inject(HttpClient);

  respond(
    token: string,
    action: 'accept' | 'decline'
  ): Observable<InvitationResponse> {
    const body = { token, action };
    
    return this.http.post<InvitationResponse>(`${API_URL}/respond`, body).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    // Extrae el mensaje de error que envía el backend
    const errorMessage = error.error?.message || 'Ocurrió un error desconocido. Por favor, intenta de nuevo.';
    return throwError(() => new Error(errorMessage));
  }
}
