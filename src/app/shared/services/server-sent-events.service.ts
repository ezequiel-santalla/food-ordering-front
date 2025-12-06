import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth-service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ServerSentEventsService {
  private authService = inject(AuthService);

  private readonly EVENT_TYPES = [
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

  constructor(private _zone: NgZone) {}

  subscribeToSession(): Observable<any> {
    return new Observable((observer) => {
      let retryDelay = 2000; // 2s
      let retryCount = 0;
      let eventSource: EventSource | null = null;

      const connect = () => {
        const token = this.authService.accessToken();
        if (!token) {
          observer.error('No auth token found for SSE connection');
          return;
        }

        const sseUrl = `${environment.baseUrl}/events-subscriptions/table-sessions?token=${token}`;
        eventSource = new EventSource(sseUrl);

        // 🔹 Conexión abierta correctamente
        eventSource.onopen = () => {
          this._zone.run(() => {
            console.info(`SSE connected to session`);
            retryDelay = 2000; // reiniciamos el backoff
            retryCount = 0;
          });
        };

        // 🔹 Escucha todos los tipos de eventos esperados
        this.EVENT_TYPES.forEach((eventName) => {
          eventSource!.addEventListener(eventName, (event) => {
            this._zone.run(() => {
              try {
                const payload = JSON.parse((event as MessageEvent).data);
                observer.next({ type: eventName, payload });
              } catch {
                observer.next({
                  type: eventName,
                  payload: (event as MessageEvent).data,
                });
              }

              // Si se recibe "connection-successful", reseteamos el delay
              if (eventName === 'connection-successful') {
                retryDelay = 2000;
                retryCount = 0;
              }
            });
          });
        });

        // 🔹 Manejo de errores y reconexión automática
        eventSource.onerror = (error) => {
          this._zone.run(() => {
            console.warn(`SSE error for session`, error);
            eventSource?.close();

            const token = this.authService.accessToken();
            if (!token) {
              console.error('SSE Error: No token found. Stopping retries.');
              observer.error(new Error('SSE Auth Error: User is logged out.'));
              return;
            }
            setTimeout(() => {
              retryCount++;
              retryDelay = Math.min(retryDelay * 2, 30000);

              if (retryCount > 10) {
                console.error(
                  'SSE Error: Too many retries. Stopping connection.'
                );
                observer.error(
                  new Error('SSE connection failed after 10 retries.')
                );
                return;
              }

              console.warn(`Reconnecting SSE in ${retryDelay / 1000}s`);
              connect();
            }, retryDelay);
          });
        };
      };

      connect();

      // 🔹 Cierre limpio de conexión al desuscribirse
      return () => {
        console.info(`SSE connection closed for session`);
        eventSource?.close();
      };
    });
  }
}
