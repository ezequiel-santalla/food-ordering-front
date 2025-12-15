import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, share, finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth-service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServerSentEventsService {
  private authService = inject(AuthService);
  constructor(private _zone: NgZone) {}

  private session$?: Observable<any>;
  private user$?: Observable<any>;

  private readonly SESSION_EVENT_TYPES = [
    'new-order',
    'order-update-status',
    'payment-updated',
    'special-offer',
    'new-message',
    'user-joined',
    'user-left',
    'count-updated',
    'connection-successful',
    'ping',
  ];

  private readonly USER_EVENT_TYPES = [
    'favorite-updated',
    'connection-successful',
    'ping',
  ];

  subscribeToSession(): Observable<any> {
    if (this.session$) return this.session$;

    this.session$ = this.createSseStream(
      () => `${environment.baseUrl}/events-subscriptions/table-sessions`,
      this.SESSION_EVENT_TYPES,
      'session'
    ).pipe(
      share(),
      finalize(() => (this.session$ = undefined))
    );

    return this.session$;
  }

  subscribeToUser(): Observable<any> {
    if (this.user$) return this.user$;

    this.user$ = this.createSseStream(
      () => `${environment.baseUrl}/events-subscriptions/users`,
      this.USER_EVENT_TYPES,
      'user'
    ).pipe(
      share(),
      finalize(() => (this.user$ = undefined))
    );

    return this.user$;
  }

  private createSseStream(
    urlBuilder: () => string,
    eventTypes: string[],
    label: 'session' | 'user'
  ): Observable<any> {
    return new Observable((observer) => {
      let retryDelay = 2000;
      let retryCount = 0;
      let eventSource: EventSource | null = null;

      const connect = () => {
        const token = this.authService.accessToken();
        if (!token) {
          observer.error(`No auth token found for SSE ${label}`);
          return;
        }

        const sseUrl = `${urlBuilder()}?token=${token}`;
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          this._zone.run(() => {
            console.info(`SSE connected (${label})`);
            retryDelay = 2000;
            retryCount = 0;
          });
        };

        eventTypes.forEach((eventName) => {
          eventSource!.addEventListener(eventName, (event) => {
            this._zone.run(() => {
              try {
                observer.next({
                  type: eventName,
                  payload: JSON.parse((event as MessageEvent).data),
                });
              } catch {
                observer.next({
                  type: eventName,
                  payload: (event as MessageEvent).data,
                });
              }

              if (eventName === 'connection-successful') {
                retryDelay = 2000;
                retryCount = 0;
              }
            });
          });
        });

        eventSource.onerror = (error) => {
          this._zone.run(() => {
            console.warn(`SSE error (${label})`, error);
            eventSource?.close();

            const token = this.authService.accessToken();
            if (!token) {
              observer.error(new Error(`SSE Auth Error (${label}): logged out`));
              return;
            }

            setTimeout(() => {
              retryCount++;
              retryDelay = Math.min(retryDelay * 2, 30000);

              if (retryCount > 10) {
                observer.error(new Error(`SSE failed after retries (${label})`));
                return;
              }
              connect();
            }, retryDelay);
          });
        };
      };

      connect();

      return () => {
        console.info(`SSE connection closed (${label})`);
        eventSource?.close();
      };
    });
  }
}
