import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateUserProfileRequest, UserProfile } from '../models/user-profile';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private http = inject(HttpClient);

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.baseUrl}/me/profile`);
  }

  updateUserProfile(profile: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${environment.baseUrl}/me/profile`, profile);
  }
}
