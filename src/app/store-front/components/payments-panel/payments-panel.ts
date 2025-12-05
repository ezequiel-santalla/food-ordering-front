import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayableOrderCardComponent } from '../payable-order-card/payable-order-card';
import { OrderService } from '../../services/order-service';
import { PaymentService } from '../../services/payment-service';
import { PaymentModalComponent } from '../payment/payment-modal';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

import {
  CreditCard,
  Banknote,
  CircleCheck,
  LucideAngularModule,
} from 'lucide-angular';

import {
  PaymentMethod,
  PaymentOrderView,
  PaymentRequest,
  PaymentStatus,
} from '../../models/payment.interface';

@Component({
  selector: 'app-payments-panel',
  standalone: true,
  imports: [
    CommonModule,
    PayableOrderCardComponent,
    PaymentModalComponent,
    LucideAngularModule,
  ],
  templateUrl: './payments-panel.html',
})
export class PaymentsPanelComponent {
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private sweet = inject(SweetAlertService);

  readonly PaymentMethod = PaymentMethod;
  readonly CircleCheck = CircleCheck;

  @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;

  active = signal<'mine' | 'table'>('mine');
  setTab(t: 'mine' | 'table') {
    this.active.set(t);
  }

  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo', icon: Banknote },
    {
      value: PaymentMethod.CREDIT_CARD,
      label: 'Tarjeta de Crédito / Débito',
      icon: CreditCard,
    },
  ];

  selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);

  isProcessingPayment = this.paymentService.isProcessing;

  myOrders = this.orderService.myOrders;
  tableOrders = this.orderService.tableOrders;

  unpaidMine = computed(() => this.myOrders().filter((o) => !o.payment));
  unpaidTable = computed(() => this.tableOrders().filter((o) => !o.payment));
  paidMine = computed(() => this.myOrders().filter((o) => !!o.payment));
  paidTable = computed(() => this.tableOrders().filter((o) => !!o.payment));

  isPaid(order: any): boolean {
    return !!order.payment;
  }

  selectedOrders = signal<string[]>([]);

  toggleSelection(event: { orderId: string; selected: boolean }) {
    this.selectedOrders.update((ids) =>
      event.selected
        ? [...ids, event.orderId]
        : ids.filter((id) => id !== event.orderId)
    );
  }

  total = computed(() =>
    this.selectedOrders().reduce((sum, id) => {
      const order =
        this.unpaidMine().find((o) => o.publicId === id) ||
        this.unpaidTable().find((o) => o.publicId === id);
      return order ? sum + order.totalPrice : sum;
    }, 0)
  );

  selectedOrdersView = computed<PaymentOrderView[]>(
    () =>
      this.selectedOrders()
        .map((id) => {
          const order =
            this.unpaidMine().find((o) => o.publicId === id) ||
            this.unpaidTable().find((o) => o.publicId === id);

          return order
            ? {
                publicId: order.publicId,
                orderNumber: order.orderNumber,
                items: order.orderDetails.map((d) => ({
                  quantity: d.quantity,
                  productName: d.productName,
                  subtotal: d.subtotal,
                })),
              }
            : null;
        })
        .filter((o) => o !== null) as PaymentOrderView[]
  );

  pay() {
    if (this.selectedOrders().length === 0) return;
    this.payModalCmp?.open();
  }

  confirmPayment() {
    const ids = this.selectedOrders();
    if (ids.length === 0) return;

    const method = this.selectedPaymentMethod();

    const request: PaymentRequest = {
      idempotencyKey: '',
      paymentMethod: method,
      orderIds: ids,
    };

    this.paymentService.createPayment(request).subscribe({
      next: (payment) => {
        if (method === PaymentMethod.CASH) {
          this.processCashPayment(payment.publicId);
          return;
        }

        if (method === PaymentMethod.CREDIT_CARD) {
          this.processCardPayment(payment.publicId);
          return;
        }
      },
      error: (err) => this.finishError(err),
    });
  }

  private processCashPayment(paymentId: string) {
    this.paymentService
      .processPayment(paymentId, {
        paymentMethod: PaymentMethod.CASH,
        payerEmail: 'cliente@test.com',
      })
      .subscribe({
        next: () => this.finishSuccess('Pago registrado'),
        error: (err) => this.finishError(err),
      });
  }

  private processCardPayment(paymentId: string) {
    this.paymentService.createCheckoutProPreference(paymentId).subscribe({
      next: (pref) => {
        this.payModalCmp?.close();
        this.sweet.showInfo(
          'Redirigiendo a MercadoPago…',
          'Un momento por favor'
        );
        setTimeout(() => (window.location.href = pref.checkoutUrl), 700);
      },
      error: (err) => this.finishError(err),
    });
  }

  private finishSuccess(msg: string) {
    this.payModalCmp?.close();
    this.sweet.showConfirmableSuccess('¡Pago exitoso!', msg);
    this.selectedOrders.set([]);
    this.orderService.reloadMyOrders?.();
  }

  private finishError(err: any) {
    console.error('❌ Error:', err);
    this.payModalCmp?.close();
    this.sweet.showError(
      'Error al procesar pago',
      err?.error?.message || 'Intenta nuevamente'
    );
  }
}
