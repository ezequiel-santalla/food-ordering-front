import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CountryResponseDto { id: number; name: string; }
export interface ProvinceResponseDto { id: number; name: string; countryId: number; }
export interface CityResponseDto { id: number; name: string; provinceId: number; }

@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);
  private base = environment.baseUrl;

  private countriesCache: CountryResponseDto[] | null = null;
  private provincesCache = new Map<number, ProvinceResponseDto[]>();
  private citiesCache = new Map<number, CityResponseDto[]>();

  getCountries(): Observable<CountryResponseDto[]> {
    if (this.countriesCache) return of(this.countriesCache);
    return this.http.get<CountryResponseDto[]>(`${this.base}/countries`).pipe(
      tap(data => (this.countriesCache = data))
    );
  }

  getProvincesByCountry(countryId: number): Observable<ProvinceResponseDto[]> {
    if (this.provincesCache.has(countryId)) return of(this.provincesCache.get(countryId)!);
    return this.http.get<ProvinceResponseDto[]>(`${this.base}/countries/${countryId}/provinces`).pipe(
      tap(data => this.provincesCache.set(countryId, data))
    );
  }

  getCitiesByProvince(provinceId: number): Observable<CityResponseDto[]> {
    if (this.citiesCache.has(provinceId)) return of(this.citiesCache.get(provinceId)!);
    return this.http.get<CityResponseDto[]>(`${this.base}/provinces/${provinceId}/cities`).pipe(
      tap(data => this.citiesCache.set(provinceId, data))
    );
  }
}
