import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-angular';

import { OrderService } from '../../../services/order-service';
import { TableSessionService } from '../../../services/table-session-service';
import { PaymentService } from '../../../services/payment-service';
import {
  PaymentMethod,
  PaymentOrderView,
} from '../../../models/payment.interface';

import { OrderCardComponent } from '../Order-card/order-card';
import { PaymentModalComponent } from '../../payment/payment-modal/payment-modal';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-table-orders',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    OrderCardComponent,
  ],
  templateUrl: './table-orders.html',
})
export class TableOrders {
  readonly Package = Package;
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;

  private orderService = inject(OrderService);
  private tableSessionService = inject(TableSessionService);
  private paymentService = inject(PaymentService);
  private sweetAlertService = inject(SweetAlertService);

  @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;

  orders = this.orderService.tableOrders;
  isLoading = this.orderService.isLoading;
  error = this.orderService.error;

  tableNumber = computed(
    () => this.tableSessionService.tableSessionInfo().tableNumber
  );

  private selectedOrderIds = signal<Set<string>>(new Set());

  selectedOrders = computed(() =>
    this.orders().filter((o) => this.selectedOrderIds().has(o.publicId))
  );

  totalToPay = computed(() =>
    this.selectedOrders().reduce((sum, o) => sum + o.totalPrice, 0)
  );

  hasSelectedOrders = computed(() => this.selectedOrderIds().size > 0);

  selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);

  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo', icon: this.Banknote },
    {
      value: PaymentMethod.CREDIT_CARD,
      label: 'Tarjeta de Crédito',
      icon: this.CreditCard,
    },
    {
      value: PaymentMethod.DEBIT_CARD,
      label: 'Tarjeta de Débito',
      icon: this.CreditCard,
    },
  ];

  paymentOrdersView = computed<PaymentOrderView[]>(() =>
    this.selectedOrders().map((o) => ({
      publicId: o.publicId,
      orderNumber: o.orderNumber,
      items: o.orderDetails.map((d) => ({
        quantity: d.quantity,
        productName: d.productName,
        subtotal: d.subtotal, // si después querés mostrar el precio
      })),
    }))
  );

  onOrderSelected(event: { orderId: string; isSelected: boolean }) {
    this.selectedOrderIds.update((prev) => {
      const next = new Set(prev);
      event.isSelected ? next.add(event.orderId) : next.delete(event.orderId);
      return next;
    });
  }

  onPaymentMethodChange(method: PaymentMethod) {
    this.selectedPaymentMethod.set(method);
  }

  confirmPayment() {
    if (!this.hasSelectedOrders()) return;

    const orderIds = Array.from(this.selectedOrderIds());
    const total = this.totalToPay();
    const paymentMethod = this.selectedPaymentMethod();

    this.paymentService.createPayment({idempotencyKey: '', paymentMethod, orderIds }).subscribe({
      next: (response) => {
        console.log('✅ Pago exitoso:', response);
        this.payModalCmp?.close();
        this.sweetAlertService.showConfirmableSuccess(
          '¡Pago exitoso!',
          `Pagaste $${total.toFixed(2)}`
        );
        this.selectedOrderIds.set(new Set());
        this.selectedPaymentMethod.set(PaymentMethod.CASH);
      },
      error: (err) => {
        console.error('❌ Error en el pago:', err);
        this.payModalCmp?.close();
        this.sweetAlertService.showError(
          'Error Al Pagar',
          'No se pudo procesar el Pago'
        );
      },
    });
  }

  getTotalTable(): number {
    return this.orders().reduce((t, o) => t + o.totalPrice, 0);
  }
}
