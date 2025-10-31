import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ServerSentEventsService {
  private authService = inject(AuthService);

  private readonly EVENT_TYPES = [
    'new-order',
    'order-confirmed',
    'order-served',
    'order-cancelled',
    'special-offer',
    'new-message',
    'user-joined',
    'user-left',
    'count-updated',
    'connection-successful',
    'ping',
  ];

  constructor(private _zone: NgZone) {}

  subscribeToSession(tableSessionId: string): Observable<any> {
    return new Observable((observer) => {
      let retryDelay = 2000; // 2s
      let eventSource: EventSource | null = null;

      const connect = () => {
        const token = this.authService.accessToken();
        if (!token) {
          observer.error('No auth token found for SSE connection');
          return;
        }

        const sseUrl = `${environment.baseUrl}/events-subscriptions/table-sessions/${tableSessionId}?token=${token}`;
        eventSource = new EventSource(sseUrl);

        // 🔹 Conexión abierta correctamente
        eventSource.onopen = () => {
          this._zone.run(() => {
            console.info(`SSE connected to session ${tableSessionId}`);
            retryDelay = 2000; // reiniciamos el backoff
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
              }
            });
          });
        });

        // 🔹 Manejo de errores y reconexión automática
        eventSource.onerror = (error) => {
          this._zone.run(() => {
            console.warn(`SSE error for session ${tableSessionId}:`, error);
            observer.error(error);
            eventSource?.close();
            setTimeout(() => {
              retryDelay = Math.min(retryDelay * 2, 30000);
              console.warn(`Reconnecting SSE in ${retryDelay / 1000}s`);
              connect();
            }, retryDelay);
          });
        };
      };

      connect();

      // 🔹 Cierre limpio de conexión al desuscribirse
      return () => {
        console.info(`SSE connection closed for session ${tableSessionId}`);
        eventSource?.close();
      };
    });
  }
}
