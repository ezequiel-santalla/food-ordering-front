import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FoodVenuePage, FoodVenuePublicResponseDto } from '../models/food-venue.interface';
import { Menu } from '../../store-front/models/menu.interface';

@Injectable({
  providedIn: 'root',
})
export class FoodVenueService {
  private http = inject(HttpClient);

  private CACHE_TTL = 10 * 60 * 1000;

  private VENUES_CACHE_KEY = 'dinno-food-venues-v1';
  private CURRENT_FOOD_VENUE_CACHE_PREFIX = 'dinno-current-food-venue';
  private MENU_CACHE_PREFIX = 'dinno-menu-venue';
  private saveToCache(key: string, value: any) {
    const payload = {
      value,
      expiresAt: Date.now() + this.CACHE_TTL,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  private loadFromCache<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.value as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private removeCache(key: string) {
    localStorage.removeItem(key);
  }

  getFoodVenues(): Observable<FoodVenuePage> {
    const cached = this.loadFromCache<FoodVenuePage>(this.VENUES_CACHE_KEY);
    if (cached) return of(cached);

    return this.http
      .get<FoodVenuePage>(`${environment.baseUrl}/public/food-venues`)
      .pipe(tap((data) => this.saveToCache(this.VENUES_CACHE_KEY, data)));
  }

  getCurrentFoodVenue(): Observable<FoodVenuePublicResponseDto> {
    const cacheKey = `${this.CURRENT_FOOD_VENUE_CACHE_PREFIX}`;
    const cached = this.loadFromCache<FoodVenuePublicResponseDto>(cacheKey);

    if (cached) return of(cached);
    
    return this.http
      .get<FoodVenuePublicResponseDto>(`${environment.baseUrl}/food-venues/current`)
      .pipe(tap((data) => this.saveToCache(cacheKey, data)));
  }

  getMenuByFoodVenueId(id: string): Observable<Menu> {
    const cacheKey = `${this.MENU_CACHE_PREFIX}${id}`;
    const cached = this.loadFromCache<Menu>(cacheKey);

    if (cached) return of(cached);

    return this.http
      .get<Menu>(`${environment.baseUrl}/public/food-venues/${id}/menu`)
      .pipe(tap((data) => this.saveToCache(cacheKey, data)));
  }

  clearVenuesCache() {
    this.removeCache(this.VENUES_CACHE_KEY);
    this.removeCache(this.CURRENT_FOOD_VENUE_CACHE_PREFIX);
  }

  clearMenuCacheForVenue(id: string) {
    this.removeCache(`${this.MENU_CACHE_PREFIX}${id}`);
  }

  clearAll() {
    this.clearVenuesCache();
    Object.keys(localStorage)
      .filter((k) => k.startsWith(this.MENU_CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  }
}
