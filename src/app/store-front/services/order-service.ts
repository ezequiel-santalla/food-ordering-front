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
import { catchError, tap } from 'rxjs/operators';
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
  private _isLoading: WritableSignal<boolean> = signal(true);
  private _error: WritableSignal<string | null> = signal(null);

  private readonly DEFAULT_PAGE = 0;
  private readonly PAGE_SIZE = 50;
  private readonly DEFAULT_SORT = 'creationDate,desc';

  myOrders = computed(() => this._myOrders());
  tableOrders = computed(() => this._tableOrders());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());
  myOrdersView = computed(() => [...this.myOrders()].sort(this.sortOrdersForHistory));
  tableOrdersView = computed(() => [...this.tableOrders()].sort(this.sortOrdersForHistory));

  private sseSub?: Subscription;

  constructor() {
    effect((cleanup) => {
      const sessionId = this.tableSession.sessionId();

      if (!sessionId) {
        this._myOrders.set([]);
        this._tableOrders.set([]);
        this._isLoading.set(false);
        this._error.set(null);
        this.sseSub?.unsubscribe();
        this.sseSub = undefined;
        return;
      }

      const firstTime = !this.sseSub;

      if (firstTime) {
        this.loadInitialOrders();
        this.subscribeToEvents();
      }

      cleanup(() => {
        this._myOrders.set([]);
        this._tableOrders.set([]);
        this._isLoading.set(true);
        this._error.set(null);
        this.sseSub?.unsubscribe();
        this.sseSub = undefined;
      });
    });
  }

  createOrder(order: OrderRequest): Observable<OrderResponse> {
    return this.http
      .post<OrderResponse>(`${environment.baseUrl}/orders`, order)
      .pipe(
        tap((created) => {
          this.onNewOrder(created);
        }),
      );
  }

  private buildPageParams(page = this.DEFAULT_PAGE, size = this.PAGE_SIZE) {
    return {
      page: String(page),
      size: String(size),
      sort: this.DEFAULT_SORT,
    };
  }

  private loadInitialOrders(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .get<PaginatedResponse<OrderResponse>>(
        `${environment.baseUrl}/participants/table-sessions/orders`,
        { params: this.buildPageParams(0, 50) },
      )
      .pipe(
        catchError(() => {
          this._error.set('No se pudieron cargar los pedidos.');
          this._isLoading.set(false);
          return EMPTY;
        }),
      )
      .subscribe((resp) => {
        const orders = (resp.content ?? []).sort(this.sortOrders);
        const myId = this.tableSession.myParticipantId();

        this._tableOrders.set(orders);
        this._myOrders.set(orders.filter((o) => o.participantId === myId));
        this._isLoading.set(false);
      });
  }

  reloadMyOrders(): void {
    this.http
      .get<PaginatedResponse<OrderResponse>>(
        `${environment.baseUrl}/participants/orders`,
        { params: this.buildPageParams(0, 50) },
      )
      .pipe(
        catchError(() => {
          this._error.set('No se pudieron cargar mis pedidos.');
          return EMPTY;
        }),
      )
      .subscribe((resp) => {
        const orders = (resp.content ?? []).sort(this.sortOrders);
        this._myOrders.set(orders);
      });
  }

  cancelOrder(orderId: string) {
    console.log('cancelando orden: ', orderId);
    return this.http.patch(
      `${environment.baseUrl}/orders/${orderId}/cancel`,
      {}
    );
  }
  
  private subscribeToEvents(): void {
    this.sseSub?.unsubscribe();
    this.sseSub = this.sse
      .subscribeToSession()
      .subscribe(({ type, payload }) => {
        if (type === 'new-order') this.onNewOrder(payload);
        if (type === 'order-update-status') this.onOrderStatusUpdate(payload);
        if (type === 'payment-updated') {
          this.onPaymentUpdated(payload);
          const myId = this.tableSession.myParticipantId();
          this.paymentsStore.onPaymentUpdatedFromSse(payload, myId);
        }
      });
  }

  private onNewOrder(order: OrderResponse) {
    this._tableOrders.update((list) => this.upsertOrder(list, order).sort(this.sortOrders));

    const myId = this.tableSession.myParticipantId();

    if (order.participantId === myId) {
      this._myOrders.update((list) => this.upsertOrder(list, order).sort(this.sortOrders));
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

    const myId = this.tableSession.myParticipantId();

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

  private upsertOrder(
    list: OrderResponse[],
    incoming: OrderResponse,
  ): OrderResponse[] {
    const idx = list.findIndex((o) => o.publicId === incoming.publicId);
    if (idx === -1) return [incoming, ...list];

    const merged = { ...list[idx], ...incoming };
    const next = list.slice();
    next[idx] = merged;

    return next;
  }

  private sortOrders = (a: OrderResponse, b: OrderResponse) =>
    Number(b.orderNumber) - Number(a.orderNumber);

  private isCancelled(o: any) {
    return o.status === 'CANCELLED';
  }

  private sortOrdersForHistory = (a: any, b: any) => {
    const ac = this.isCancelled(a) ? 1 : 0;
    const bc = this.isCancelled(b) ? 1 : 0;
    if (ac !== bc) return ac - bc;

    const ad = new Date(a.orderDate ?? a.createdAt ?? 0).getTime();
    const bd = new Date(b.orderDate ?? b.createdAt ?? 0).getTime();
    return bd - ad;
  };
}
