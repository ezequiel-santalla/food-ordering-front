import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, finalize, share } from 'rxjs';
import { AuthService } from '../../auth/services/auth-service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServerSentEventsService {
  private authService = inject(AuthService);
  constructor(private zone: NgZone) {}

  private session$?: Observable<any>;
  private user$?: Observable<any>;

  private readonly SESSION_EVENT_TYPES = [
    'new-order',
    'order-update-status',
    'payment-updated',
    'special-offer',
    'new-message',
    'user-joined',
    'migrated-guest-session',
    'host-delegated',
    'user-left',
    'count-updated',
    'connection-successful',
    'ping',
  ];

  private readonly USER_EVENT_TYPES = [
    'new_notification',
    'favorite-updated',
    'connection-successful',
    'ping',
  ];

  subscribeToSession(): Observable<any> {
    if (!this.session$) {
      this.session$ = this.createSseStream(
        () => `${environment.baseUrl}/events-subscriptions/table-sessions`,
        this.SESSION_EVENT_TYPES,
        'session'
      ).pipe(
        finalize(() => (this.session$ = undefined)),
        share({ resetOnRefCountZero: true })
      );
    }
    return this.session$;
  }

  subscribeToUser(): Observable<any> {
    if (!this.user$) {
      this.user$ = this.createSseStream(
        () => `${environment.baseUrl}/events-subscriptions/users`,
        this.USER_EVENT_TYPES,
        'user'
      ).pipe(
        finalize(() => (this.user$ = undefined)),
        share({ resetOnRefCountZero: true })
      );
    }
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
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

      const clearReconnectTimer = () => {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      const closeEventSource = () => {
        try {
          eventSource?.close();
        } catch {}
        eventSource = null;
      };

      const connect = () => {
        console.count(`SSE connect (${label})`);

        const token = this.authService.accessToken();
        if (!token) {
          clearReconnectTimer();
          observer.error(new Error(`No auth token found for SSE ${label}`));
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, retryDelay);
          retryDelay = Math.min(retryDelay *2, 30000);
          return;
        }

        const clientId = this.getOrCreateClientId(label);
        console.log('clientId: ', clientId);
        const sseUrl = `${urlBuilder()}?token=${encodeURIComponent(token)}&clientId=${encodeURIComponent(clientId)}`;
console.log('SSE connect attempt', {
  label,
  token: !!this.authService.accessToken(),
  sessionId: this.authService.tableSessionId?.(),
  clientId
});
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          clearReconnectTimer();
          this.zone.run(() => {
            console.info(`SSE connected (${label})`);
            retryDelay = 2000;
            retryCount = 0;
          });
        };

        eventTypes.forEach((eventName) => {
          eventSource!.addEventListener(eventName, (event) => {
            this.zone.run(() => {
              const data = (event as MessageEvent).data;
              try {
                observer.next({ type: eventName, payload: JSON.parse(data) });
              } catch {
                observer.next({ type: eventName, payload: data });
              }

              if (eventName === 'connection-successful') {
                retryDelay = 2000;
                retryCount = 0;
              }
            });
          });
        });

        eventSource.onerror = (error) => {
          this.zone.run(() => {
            console.warn(`SSE error (${label})`, error);
            console.warn('SSE error', {label, readyState: eventSource?.readyState});

            closeEventSource();

            const stillHasToken = !!this.authService.accessToken();
            if (!stillHasToken) {
              clearReconnectTimer();
              observer.error(new Error(`SSE Auth Error (${label}): logged out`));
              return;
            }

            clearReconnectTimer();

            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;

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
        clearReconnectTimer();
        closeEventSource();
      };
    });
  }

  private getOrCreateClientId(label: string): string {
    const key = `dinno-sse-clientId-${label}`;
    let v = sessionStorage.getItem(key);
    if (!v) {
      v = crypto.randomUUID();
      sessionStorage.setItem(key, v);
    }
    return v;
  }
}