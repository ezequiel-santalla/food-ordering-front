import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { filter, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServerSentEventsService } from '../../shared/services/server-sent-events.service';
import { AuthStateManager } from '../../auth/services/auth-state-manager-service';
import { NotificationResponseDto } from '../models/notification.interface';
import { PaginatedResponse } from '../../shared/components/pagination/pagination.interface';

export interface UnreadCountDto {
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private http = inject(HttpClient);
  private sse = inject(ServerSentEventsService);
  private authState = inject(AuthStateManager);

  private baseUrl = `${environment.baseUrl}/notifications`;

  getUnreadCount(): Observable<UnreadCountDto> {
    return this.http.get<UnreadCountDto>(`${this.baseUrl}/unread-count`);
  }

  getMyNotifications(opts: { page?: number; size?: number }): Observable<PaginatedResponse<NotificationResponseDto>> {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', opts.page);
    if (opts.size != null) params = params.set('size', opts.size);
    params = params.set('sort', 'creationDate,desc');
    return this.http.get<PaginatedResponse<NotificationResponseDto>>(this.baseUrl, { params });
  }

  markAsRead(publicId: string): Observable<NotificationResponseDto> {
    return this.http.patch<NotificationResponseDto>(`${this.baseUrl}/${publicId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/read-all`, {});
  }

  newNotifications$(): Observable<NotificationResponseDto> {
    if (!this.authState.isAuthenticated()) {
      return new Observable<NotificationResponseDto>((sub) => sub.complete());
    }

    return this.sse.subscribeToUser().pipe(
      filter((e) => e?.type === 'new_notification'),
      map((e) => e.payload as NotificationResponseDto)
    );
  }
}