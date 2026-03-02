import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SelectOption } from '../../shared/components/searchable-select-component/searchable-select-component';

@Injectable({ providedIn: 'root' })
export class RootApiService {
  private http = inject(HttpClient);

  private readonly ROOT_URL = `${environment.baseUrl}/root`;
  private readonly USERS_URL = `${this.ROOT_URL}/users`;
  private readonly ADMINS_URL = `${this.ROOT_URL}/admins`;
  private readonly VENUES_URL = `${environment.baseUrl}/food-venues/root`;

  getUsers(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(`${this.USERS_URL}/all`, { params });
  }

  getVenues(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    console.log('llmando a ', this.VENUES_URL);
    return this.http.get<any>(`${this.VENUES_URL}`, { params });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.USERS_URL}/${id}`);
  }

  registerAdmin(adminData: any): Observable<any> {
    return this.http.post<any>(this.ADMINS_URL, adminData);
  }

  registerRoot(rootData: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/register`, rootData);
  }

  selectContext(foodVenueId?: string): Observable<any> {
    let params = new HttpParams();
    if (foodVenueId) {
       params = params.set('foodVenueId', foodVenueId);
    }

    return this.http.post<any>(`${this.ROOT_URL}/select-context`, null, { params });
  }

  createFoodVenue(venue: any, logo?: File, banner?: File): Observable<any> {
    const formData = new FormData();

    const venueBlob = new Blob([JSON.stringify(venue)], {
      type: 'application/json',
    });
    formData.append('venue', venueBlob);

    if (logo) formData.append('logo', logo);
    if (banner) formData.append('banner', banner);

    return this.http.post(`${environment.baseUrl}/food-venues`, formData);
  }

  getCities(): Observable<SelectOption[]> {
    return this.http.get<SelectOption[]>(`${environment.baseUrl}/cities`);
  }

  deleteFoodVenue(id: string): Observable<void> {
    return this.http.delete<void>(`${this.VENUES_URL}/${id}`);
  }
}
