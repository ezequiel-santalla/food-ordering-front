import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  WritableSignal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderRequest, OrderResponse } from '../models/order.interface';
import { PaginatedResponse } from '../../shared/components/pagination/pagination.interface';
import { environment } from '../../../environments/environment';

import { TableSessionService } from './table-session-service';
import { ServerSentEventsService } from '../../shared/services/server-sent-events.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { PaymentResponseDto } from '../models/payment.interface';
import { PaymentsStore } from './payment-store';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private sse = inject(ServerSentEventsService);
  private tableSession = inject(TableSessionService);
  private sweet = inject(SweetAlertService);
  private paymentsStore = inject(PaymentsStore);

  private _myOrders: WritableSignal<OrderResponse[]> = signal([]);
  private _tableOrders: WritableSignal<OrderResponse[]> = signal([]);
  private _isLoading: WritableSignal<boolean> = signal(false);
  private _error: WritableSignal<string | null> = signal(null);

  myOrders = computed(() => this._myOrders());
  tableOrders = computed(() => this._tableOrders());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());

  private sseSub?: Subscription;

  constructor() {
    effect((cleanup) => {
      const sessionId = this.tableSession.tableSessionInfo().sessionId;

      if (sessionId) {
        this.loadInitialOrders();
        this.subscribeToEvents();
      }

      cleanup(() => {
        this._myOrders.set([]);
        this._tableOrders.set([]);
        this.sseSub?.unsubscribe();
      });
    });
  }

  createOrder(order: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${environment.baseUrl}/orders`,
      order
    );
  }

  private loadInitialOrders(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .get<PaginatedResponse<OrderResponse>>(
        `${environment.baseUrl}/participants/table-sessions/orders`
      )
      .pipe(
        catchError(() => {
          this._error.set('No se pudieron cargar los pedidos.');
          this._isLoading.set(false);
          return EMPTY;
        })
      )
      .subscribe((resp) => {
        const orders = (resp.content ?? []).sort(this.sortOrders);
        const myId = this.tableSession.tableSessionInfo().participantId;

        this._tableOrders.set(orders);
        this._myOrders.set(orders.filter((o) => o.participantId === myId));
        this._isLoading.set(false);
      });
  }

  reloadMyOrders(): void {
    this.http
      .get<PaginatedResponse<OrderResponse>>(
        `${environment.baseUrl}/participants/orders`
      )
      .pipe(
        catchError(() => {
          this._error.set('No se pudieron cargar mis pedidos.');
          return EMPTY;
        })
      )
      .subscribe((resp) => {
        const orders = (resp.content ?? []).sort(this.sortOrders);
        this._myOrders.set(orders);
      });
  }

  private subscribeToEvents(): void {
    this.sseSub?.unsubscribe();

    this.sseSub = this.sse.subscribeToSession().subscribe({
      next: (e) => {
        console.log('EVENTO SSE RECIBIDO en subscribeToEvents:', e);
        if (e.type === 'new-order') this.onNewOrder(e.payload);
        if (e.type === 'order-update-status')
          this.onOrderStatusUpdate(e.payload);
        if (e.type === 'payment-updated') {
          this.onPaymentUpdated(e.payload);
          const myId = this.tableSession.tableSessionInfo().participantId;
          this.paymentsStore.onPaymentUpdatedFromSse(e.payload, myId);
        }
      },
    });
  }

  private onNewOrder(order: OrderResponse) {
    this._tableOrders.update((list) => [order, ...list].sort(this.sortOrders));

    const myId = this.tableSession.tableSessionInfo().participantId;

    if (order.participantId === myId) {
      this._myOrders.update((list) => [order, ...list].sort(this.sortOrders));
    } else {
      this.sweet.showInfo(
        'Pedido agregado',
        `${order.clientAlias} realizó un pedido`
      );
    }
  }

  private onOrderStatusUpdate(order: OrderResponse) {
    this._tableOrders.update((list) =>
      list
        .map((o) => (o.publicId === order.publicId ? order : o))
        .sort(this.sortOrders)
    );

    const myId = this.tableSession.tableSessionInfo().participantId;

    if (order.participantId === myId) {
      this._myOrders.update((list) =>
        list
          .map((o) => (o.publicId === order.publicId ? order : o))
          .sort(this.sortOrders)
      );
    }
  }

  private onPaymentUpdated(payment: PaymentResponseDto) {
    const affected = payment.orderNumbers ?? [];
    const paidBy = payment.participant.nickname;

    const updatePayment = (o: OrderResponse) => {
      const n = Number(o.orderNumber);
      if (!affected.includes(n)) return o;

      return {
        ...o,
        payment: {
          ...payment,
          paidBy,
        },
      };
    };

    this._tableOrders.update((list) =>
      list.map(updatePayment).sort(this.sortOrders)
    );

    this._myOrders.update((list) =>
      list.map(updatePayment).sort(this.sortOrders)
    );
  }

  private sortOrders = (a: OrderResponse, b: OrderResponse) =>
    Number(b.orderNumber) - Number(a.orderNumber);
}
