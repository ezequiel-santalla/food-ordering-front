import { Injectable, inject, signal, computed, effect } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PaginatedResponse,
  PageableParams,
} from '../../shared/components/pagination/pagination.interface';

import { PaymentResponseDto, PaymentStatus } from '../models/payment.interface';

import { ServerSentEventsService } from '../../shared/services/server-sent-events.service';
import { TableSessionService } from './table-session-service';

@Injectable({ providedIn: 'root' })
export class PaymentsStore {
  private http = inject(HttpClient);
  private sse = inject(ServerSentEventsService);
  private tableSession = inject(TableSessionService);

  private _page = signal<PaginatedResponse<PaymentResponseDto> | null>(null);
  isLoading = signal<boolean>(false);

  page = computed(() => this._page());

  payments = computed(() => {
    const list = this._page()?.content ?? [];

    return [...list].sort((a, b) => {
      if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1;
      if (a.status !== 'CANCELLED' && b.status === 'CANCELLED') return -1;

      return (
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );
    });
  });

  pending = computed(() =>
    this.payments().filter((p) => p.status === PaymentStatus.PENDING)
  );

  completed = computed(() =>
    this.payments().filter((p) => p.status === PaymentStatus.COMPLETED)
  );

  cancelled = computed(() =>
    this.payments().filter((p) => p.status === PaymentStatus.CANCELLED)
  );

  private sseSub?: Subscription;

  constructor() {
    effect((cleanup) => {
      const sessionId = this.tableSession.tableSessionInfo().sessionId;

      if (sessionId) {
        this.loadInitialPayments();
        this.subscribeToEvents();
      }

      cleanup(() => {
        this._page.set(null);
        this.sseSub?.unsubscribe();
      });
    });
  }

  private buildParams(params: PageableParams = {}): Record<string, string> {
    const httpParams: Record<string, string> = {};

    if (params.page !== undefined) httpParams['page'] = params.page.toString();
    if (params.size !== undefined) httpParams['size'] = params.size.toString();
    if (params.sort !== undefined) {
      httpParams['sort'] = Array.isArray(params.sort)
        ? params.sort.join(',')
        : params.sort;
    }

    return httpParams;
  }

  loadInitialPayments(params: PageableParams = {}) {
    const httpParams = this.buildParams(params);

    this.isLoading.set(true);

    this.http
      .get<PaginatedResponse<PaymentResponseDto>>(
        `${environment.baseUrl}/participants/payments`,
        { params: httpParams }
      )
      .subscribe({
        next: (res) => {
          this._page.set(res);
          this.isLoading.set(false);
        },
        error: () => {
          this._page.set(null);
          this.isLoading.set(false);
        },
      });
  }

  private subscribeToEvents() {
    this.sseSub?.unsubscribe();

    this.sseSub = this.sse.subscribeToSession().subscribe((e) => {
      if (e.type === 'payment-updated') {
        const myId = this.tableSession.tableSessionInfo().participantId;
        this.onPaymentUpdatedFromSse(e.payload, myId);
      }
    });
  }

  onPaymentUpdatedFromSse(payment: PaymentResponseDto, myId: string) {
    if (payment.participant.publicId !== myId) return;

    if (!this._page()) return;

    this._page.update((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        content: prev.content.map((p) =>
          p.publicId === payment.publicId ? { ...p, ...payment } : p
        ),
      };
    });
  }

  cancelPayment(paymentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .patch(
          `${environment.baseUrl}/payments/${paymentId}/cancel-payment`,
          {}
        )
        .subscribe({
          next: () => {
            this._page.update((prev) =>
              prev
                ? {
                    ...prev,
                    content: prev.content.map((p) =>
                      p.publicId === paymentId
                        ? { ...p, status: PaymentStatus.CANCELLED }
                        : p
                    ),
                  }
                : prev
            );
            resolve();
          },
          error: (err) => reject(err),
        });
    });
  }
}
