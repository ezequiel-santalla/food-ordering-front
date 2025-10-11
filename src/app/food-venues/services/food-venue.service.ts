import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FoodVenue, Content } from '../models/food-venue.interface';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { MenuElement } from '../../store-front/models/menu.interface';

@Injectable({
  providedIn: 'root'
})
export class FoodVenueService {

  private http = inject(HttpClient);

  getFoodVenues(): Observable<Content[]> {
    return this.http.get<FoodVenue>(`${environment.baseUrl}/public/food-venues`)
      .pipe(map(response => {
        return response.content;
      }
      ));
  }

  getMenuByFoodVenueId(id: string): Observable<MenuElement> {
    return this.http.get<MenuElement>(`${environment.baseUrl}/public/food-venues/${id}/menu`);
  }
}
