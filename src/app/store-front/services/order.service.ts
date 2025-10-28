// order.service.ts (Refactorizado con Signals y SSE)

import { Injectable, inject, signal, computed, effect, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { OrderRequest, OrderResponse } from '../models/order.interface';
import { PaginatedResponse } from '../../shared/components/pagination/pagination.interface';
import { environment } from '../../../environments/environment.development';

// 🛑 Importa tus servicios de estado y SSE
import { TableSessionService } from './table-session.service'; // Asegúrate que la ruta sea correcta
import { ServerSentEventsService } from '../../shared/services/server-sent-events.service';

@Injectable({ providedIn: 'root' })
export class OrderService {

  // --- Inyecciones ---
  private http = inject(HttpClient);
  private sseService = inject(ServerSentEventsService);
  private tableSessionService = inject(TableSessionService);

  // --- Señales de Estado Privadas ---
  private _myOrders: WritableSignal<OrderResponse[]> = signal([]);
  private _tableOrders: WritableSignal<OrderResponse[]> = signal([]);
  private _isLoading: WritableSignal<boolean> = signal(false);
  private _error: WritableSignal<string | null> = signal(null);

  // --- Señales de Estado Públicas (para los componentes) ---
  public myOrders = computed(() => this._myOrders());
  public tableOrders = computed(() => this._tableOrders());
  public isLoading = computed(() => this._isLoading());
  public error = computed(() => this._error());
  
  // Para manejar la suscripción SSE
  private sseSubscription: Subscription | undefined;

  constructor() {
    console.log('OrderService inicializado');
    // Este effect es el "motor" reactivo del servicio
    effect((onCleanup) => {
      // Observa la señal de sessionId desde el TableSessionService
      const sessionId = this.tableSessionService.tableSessionInfo().sessionId;

      if (sessionId) {
        // 1. Hay sesión: Cargar datos iniciales
        console.log(`OrderService: Sesión ${sessionId} detectada. Cargando pedidos...`);
        this.loadInitialOrders(sessionId);
        
        // 2. Hay sesión: Suscribirse a eventos en tiempo real
        this.subscribeToOrderEvents(sessionId);
      }

      // 3. (onCleanup) Se llama cuando el effect "muere" (ej: sessionId cambia a null)
      onCleanup(() => {
        console.log('OrderService: Limpiando estado y desuscribiendo de SSE.');
        // Limpiar estado
        this._myOrders.set([]);
        this._tableOrders.set([]);
        this._isLoading.set(false);
        this._error.set(null);
        
        // Desuscribirse de eventos SSE
        if (this.sseSubscription) {
          this.sseSubscription.unsubscribe();
        }
      });
    }, { allowSignalWrites: true }); // Necesario porque el effect escribe en signals
  }

  // --- Métodos HTTP (Originales, ahora privados o llamados por el servicio) ---

  /**
   * (Original) Sigue siendo público, llamado por CartView para crear la orden.
   */
  createOrder(orderRequest: OrderRequest): Observable<OrderResponse> {
    // Nota: El SSE se encarga de actualizar el estado local,
    // así que no necesitamos hacer nada más aquí. El backend enviará
    // el evento "nueva-orden" después de este POST.
    return this.http.post<OrderResponse>(`${environment.baseUrl}/orders`, orderRequest);
  }

  /**
   * (Original) Ahora usado internamente para la carga inicial.
   */
  private getCurrentParticipantOrders(): Observable<PaginatedResponse<OrderResponse>> {
    return this.http.get<PaginatedResponse<OrderResponse>>(`${environment.baseUrl}/participants/orders`);
  }

  /**
   * (Original) Ahora usado internamente para la carga inicial.
   */
  private getCurrentSessionOrders(): Observable<PaginatedResponse<OrderResponse>> {
    return this.http.get<PaginatedResponse<OrderResponse>>(`${environment.baseUrl}/participants/table-sessions/orders`);
  }

  // --- Métodos de Lógica Interna ---

  /**
   * Carga los pedidos "Mis Pedidos" y "Pedidos de Mesa" al mismo tiempo.
   */
  private loadInitialOrders(sessionId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Usamos forkJoin para ejecutar ambas peticiones en paralelo
    forkJoin({
      myOrdersResponse: this.getCurrentParticipantOrders(),
      tableOrdersResponse: this.getCurrentSessionOrders()
    }).pipe(
      catchError(err => {
        console.error('OrderService: Error cargando pedidos iniciales', err);
        this._error.set('No se pudieron cargar los pedidos.');
        this._isLoading.set(false);
        return []; // Termina el stream
      })
    ).subscribe(({ myOrdersResponse, tableOrdersResponse }) => {
      console.log('OrderService: Pedidos iniciales cargados');
      // Seteamos las signals con los datos ordenados
      this._myOrders.set(myOrdersResponse.content.sort(this.sortOrders));
      this._tableOrders.set(tableOrdersResponse.content.sort(this.sortOrders));
      this._isLoading.set(false);
    });
  }

  /**
   * Se suscribe a los eventos SSE de la mesa.
   */
  private subscribeToOrderEvents(tableSessionId: string): void {
    // Si ya hay una suscripción, la cancela (aunque el effect ya debería hacer esto)
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
    
    console.log(`OrderService: Suscribiendo a SSE para mesa ${tableSessionId}`);
    this.sseSubscription = this.sseService.subscribeToSession(tableSessionId).subscribe({
      next: (event) => {
        
        // --- AQUÍ OCURRE LA MAGIA EN TIEMPO REAL ---

        if (event.type === 'new-order') {
          const newOrder: OrderResponse = event.payload;
          console.log('OrderService (SSE): Recibida nueva orden:', newOrder);

          // 1. Añadir a "Pedidos de Mesa"
          this._tableOrders.update(currentOrders =>
            [newOrder, ...currentOrders].sort(this.sortOrders)
          );

          // 2. Comprobar si también es "Mi Pedido"
          const myNickname = this.tableSessionService.tableSessionInfo().participantNickname;
          if (newOrder.clientAlias === myNickname) {
            console.log('OrderService (SSE): La nueva orden es mía.');
            this._myOrders.update(currentOrders =>
              [newOrder, ...currentOrders].sort(this.sortOrders)
            );
          }
        }
        
        // --- (Futuro) ---
        // if (event.type === 'updated-order') {
        //   const updatedOrder: OrderResponse = event.payload;
        //   // Lógica para actualizar una orden existente en las signals
        //   // (ej. cambiar PENDING a COMPLETED)
        // }

      },
      error: (err) => console.error(`OrderService: Error en conexión SSE ${tableSessionId}`, err)
    });
  }

  /**
   * Helper para ordenar pedidos por número (más reciente primero)
   */
  private sortOrders = (a: OrderResponse, b: OrderResponse): number =>
    Number(b.orderNumber) - Number(a.orderNumber);
}
