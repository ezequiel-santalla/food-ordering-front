import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import TagResponse from '../models/response/tag-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  private apiUrl = `${environment.baseUrl}/tags`;

  constructor(private http: HttpClient) {}

  getTags(): Observable<TagResponse[]> {
    return this.http.get<TagResponse[]>(this.apiUrl);
  }

  createTag(tag: { label: string }): Observable<TagResponse> {
    return this.http.post<TagResponse>(this.apiUrl, tag);
  }
}
