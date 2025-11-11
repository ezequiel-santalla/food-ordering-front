import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { FoodVenueAdminResponse, FoodVenuePublicResponse } from '../models/response/food-venue-reponse';
import { FoodVenueRequest } from '../models/request/food-venue-request';

@Injectable({
  providedIn: 'root'
})
export class FoodVenueService {

  readonly API_URL = `${environment.baseUrl}/food-venues`;

  constructor(private http: HttpClient) {}

  getMyFoodVenue(): Observable<FoodVenueAdminResponse> {
    return this.http.get<FoodVenueAdminResponse>(`${this.API_URL}/admin/current`);
  }

  updateMyCurrentFoodVenue(data: Partial<FoodVenueRequest>): Observable<FoodVenueAdminResponse> {
    return this.http.patch<FoodVenueAdminResponse>(`${this.API_URL}/admin/current`, data);
  }

  getMyCurrentFoodVenue(): Observable<FoodVenuePublicResponse> {
    
    return this.http.get<FoodVenuePublicResponse>(`${this.API_URL}/current`);
  }

}
