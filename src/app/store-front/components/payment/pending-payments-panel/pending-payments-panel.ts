import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayableOrderCardComponent } from '../../payment/payable-order-card/payable-order-card';
import { OrderService } from '../../../services/order-service';
import { PaymentService } from '../../../services/payment-service';
import { PaymentModalComponent } from '../../payment/payment-modal/payment-modal';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

import {
  CreditCard,
  Banknote,
  CircleCheck,
  LucideAngularModule,
  Smartphone,
} from 'lucide-angular';

import {
  PaymentMethod,
  PaymentOrderView,
  PaymentRequest,
  PaymentStatus,
} from '../../../models/payment.interface';
import { PaymentsStore } from '../../../services/payment-store';

@Component({
  selector: 'app-pending-payments-panel',
  standalone: true,
  imports: [
    CommonModule,
    PayableOrderCardComponent,
    PaymentModalComponent,
    LucideAngularModule,
  ],
  templateUrl: './pending-payments-panel.html',
})
export class PendingPaymentsPanelComponent implements OnInit {
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private sweet = inject(SweetAlertService);
  paymentsStore = inject(PaymentsStore);

  ngOnInit() {
    this.paymentsStore.loadInitialPayments();
  }

  readonly PaymentMethod = PaymentMethod;

  @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;

  isProcessingPayment = signal(false);

  active = signal<'mine' | 'table'>('mine');
  setTab(t: 'mine' | 'table') {
    this.active.set(t);
  }

  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo', icon: Banknote },
    {
      value: PaymentMethod.CREDIT_CARD,
      label: 'Tarjeta (en el local)',
      icon: CreditCard,
    },
    {
      value: PaymentMethod.DEBIT_CARD,
      label: 'Débito (en el local)',
      icon: CreditCard,
    },
    {
      value: PaymentMethod.OTHER,
      label: 'Transferencia / billetera',
      icon: CreditCard,
    },
  ];

  selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);

  myOrders = this.orderService.myOrders;
  tableOrders = this.orderService.tableOrders;

  unpaidMine = computed(() =>
    this.myOrders().filter(
      (o) => !o.payment || o.payment.status === 'CANCELLED'
    )
  );

  paidMine = computed(() =>
    this.myOrders().filter((o) => o.payment && o.payment.status !== 'CANCELLED')
  );

  unpaidTable = computed(() =>
    this.tableOrders().filter(
      (o) => !o.payment || o.payment.status === 'CANCELLED'
    )
  );

  paidTable = computed(() =>
    this.tableOrders().filter(
      (o) => o.payment && o.payment.status !== 'CANCELLED'
    )
  );

  selectedOrders = signal<string[]>([]);

toggleSelection(event: { orderId: string; selected: boolean }) {
  this.selectedOrders.update((ids) =>
    event.selected
      ? [...ids, event.orderId]
      : ids.filter((id) => id !== event.orderId)
  );
}


  total = computed(() => {
  return this.selectedOrders().reduce((sum, id) => {
    const order = this.orderService.tableOrders().find(o => o.publicId === id);
    return order ? sum + order.totalPrice : sum;
  }, 0);
});


  selectedOrdersView = computed<PaymentOrderView[]>(() =>
  this.selectedOrders()
    .map((id) => {
      const order = this.orderService.tableOrders().find(o => o.publicId === id);
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
    if (this.selectedOrders().length === 0 || this.isProcessingPayment())
      return;
    this.payModalCmp?.open();
  }

  confirmPayment() {
    const ids = this.selectedOrders();
    const method = this.selectedPaymentMethod();

    if (method === PaymentMethod.MOBILE_PAYMENT) {
      this.payWithMercadoPago(ids);
      return;
    }

    this.payModalCmp?.close();

    this.sweet.showLoading('Procesando pago...', 'Avisándole al mozo');

    const request: PaymentRequest = {
      idempotencyKey: '',
      paymentMethod: method,
      orderIds: ids,
    };

    this.paymentService.createPayment(request).subscribe({
      next: () => {
        this.sweet.close();

        this.sweet.showConfirmableSuccess(
          'Mozo en camino',
          'Pronto se acercará a tu mesa para cobrar.'
        );

        this.selectedOrders.set([]);
        this.orderService.reloadMyOrders?.();
      },
      error: (err) => this.finishError(err),
    });
  }

  onMercadoPagoSelected() {
    this.isProcessingPayment.set(true);
    const ids = this.selectedOrders();
    this.payWithMercadoPago(ids);
  }

  private requestInPersonPayment(ids: string[], method: PaymentMethod) {
    this.isProcessingPayment.set(true);

    const request: PaymentRequest = {
      idempotencyKey: '',
      paymentMethod: method,
      orderIds: ids,
    };

    this.paymentService.createPayment(request).subscribe({
      next: () => {
        this.isProcessingPayment.set(false);
        this.payModalCmp?.close();

        this.sweet.showConfirmableSuccess(
          'Pedido de pago enviado',
          'Un mozo se acercará a tu mesa para cobrar. El pago se marcará como completado cuando el mozo lo confirme.'
        );

        this.selectedOrders.set([]);
        this.orderService.reloadMyOrders?.();
      },
      error: (err) => this.finishError(err),
    });
  }

  private payWithMercadoPago(ids: string[]) {
    this.isProcessingPayment.set(true);

    const request: PaymentRequest = {
      idempotencyKey: '',
      paymentMethod: PaymentMethod.MOBILE_PAYMENT,
      orderIds: ids,
    };

    this.paymentService.createPayment(request).subscribe({
      next: (payment) => {
        this.paymentService
          .createCheckoutProPreference(payment.publicId)
          .subscribe({
            next: (pref) => {
              this.payModalCmp?.close();
              this.sweet.showInfo(
                'Redirigiendo a MercadoPago…',
                'Un momento por favor'
              );

              setTimeout(() => {
                window.location.href = pref.checkoutUrl;
                this.isProcessingPayment.set(false);
              }, 500);
            },
            error: (err) => this.finishError(err),
          });
      },
      error: (err) => this.finishError(err),
    });
  }

  private finishError(err: any) {
    console.error(err);
    this.isProcessingPayment.set(false);
    this.payModalCmp?.close();

    this.sweet.showError(
      'Error al procesar pago',
      err?.error?.message || 'Intenta nuevamente.'
    );
  }
}
