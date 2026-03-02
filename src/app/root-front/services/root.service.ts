import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RootService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/root/admins`;

  // Food Venues
  getAllVenues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/food-venues`);
  }

  registerVenue(venueData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/food-venues`, venueData);
  }

  // Usuarios
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/root/users`);
  }
}