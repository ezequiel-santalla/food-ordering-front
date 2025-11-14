import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FoodVenue, Content } from '../models/food-venue.interface';
import { Menu } from '../../store-front/models/menu.interface';

@Injectable({
  providedIn: 'root'
})
export class FoodVenueService {

  private http = inject(HttpClient);

  getFoodVenues(): Observable<FoodVenue> {
    return this.http.get<FoodVenue>(`${environment.baseUrl}/public/food-venues`);
  }

  getMenuByFoodVenueId(id: string): Observable<Menu> {
    return this.http.get<Menu>(`${environment.baseUrl}/public/food-venues/${id}/menu`);
  }
}
