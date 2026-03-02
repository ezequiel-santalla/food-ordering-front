import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDetailResponseDto } from '../../shared/models/user';
import { PaginatedResponse } from '../../shared/components/pagination/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class RootUserService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.baseUrl}/root/users`;

  getAll(
    search: string = '',
    page: number,
    size: number,
  ): Observable<PaginatedResponse<UserDetailResponseDto>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<UserDetailResponseDto>>(
      `${this.API_URL}/actives`,
      { params },
    );
  }

  getDeleted(
    search: string = '',
    page: number,
    size: number,
  ): Observable<PaginatedResponse<UserDetailResponseDto>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<UserDetailResponseDto>>(
      `${this.API_URL}/deleted`,
      { params },
    );
  }

  getById(id: string): Observable<UserDetailResponseDto> {
    return this.http.get<UserDetailResponseDto>(`${this.API_URL}/${id}`);
  }

  patchUser(
    id: string,
    userData: Partial<UserDetailResponseDto>,
  ): Observable<UserDetailResponseDto> {
    return this.http.patch<UserDetailResponseDto>(
      `${this.API_URL}/${id}`,
      userData,
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
