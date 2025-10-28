// sse.service.ts
import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ServerSentEventsService {
  constructor(private _zone: NgZone) {}

  private authService = inject(AuthService);

  private readonly EVENT_TYPES = [
    // Notification Events
    'new-order',
    'order-confirmed',
    'order-served',
    'order-cancelled',
    'special-offer',
    'new-message',
    // Session Events
    'user-joined',
    'user-left',
    'count-updated',
    'connection-successful',
  ];



  /**
   * Se suscribe a los eventos de una mesa específica
   * @param tableSessionId El ID de la mesa
   * @returns Un Observable que emite CUALQUIER evento de esa mesa
   */
  subscribeToSession(tableSessionId: string): Observable<any> {
    return new Observable((observer) => {

        const token = this.authService.accessToken();
      if (!token) {
        observer.error('No auth token found for SSE connection');
        return;
      }
      const sseUrl = `${environment.baseUrl}/events-subscriptions/table-sessions/${tableSessionId}?token=${token}`;
      // Crear la conexión EventSource
      const eventSource = new EventSource(sseUrl);

      // Función helper para crear los listeners
      const createEventListener = (eventName: string) => {
        eventSource.addEventListener(eventName, (event) => {
          this._zone.run(() => {
            try {
              const payload = JSON.parse((event as MessageEvent).data);
              observer.next({ type: eventName, payload: payload });
            } catch (e) {
              observer.next({
                type: eventName,
                payload: (event as MessageEvent).data,
              });
            }
          });
        });
      };

      // ✅ Creamos un listener por cada evento
      this.EVENT_TYPES.forEach((eventName) => {
        createEventListener(eventName);
      });

      // Manejador de errores
      eventSource.onerror = (error) => {
        this._zone.run(() => {
          observer.error(error);
          eventSource.close(); // Cerramos la conexión en error
        });
      };

      // Retornar la función de "teardown" (limpieza)
      // Esto se llama cuando te desuscribís del Observable
      return () => {
        eventSource.close();
      };
    });
  }
}
