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
import { PaymentService } from '../../../services/payment-service';
import { OrderCardComponent } from '../Order-card/order-card';
import {
  PaymentMethod,
  PaymentOrderView,
  PaymentStatus,
} from '../../../models/payment.interface';
import { PaymentModalComponent } from '../../payment/payment-modal';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    OrderCardComponent,
    PaymentModalComponent,
  ],
  templateUrl: './my-orders.html',
})
export class MyOrders {
  readonly Package = Package;
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;

  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private sweetAlertService = inject(SweetAlertService);

  @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;

  orders = this.orderService.myOrders;
  isLoadingOrders = this.orderService.isLoading;
  orderError = this.orderService.error;

  isProcessingPayment = this.paymentService.isProcessing;
  paymentError = this.paymentService.error;

  private selectedOrderIds = signal<Set<string>>(new Set());
  selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);

  selectedOrders = computed(() =>
    this.orders().filter((o) => this.selectedOrderIds().has(o.publicId))
  );

  totalToPay = computed(() =>
    this.selectedOrders().reduce((sum, order) => sum + order.totalPrice, 0)
  );

  hasSelectedOrders = computed(() => this.selectedOrderIds().size > 0);

  paymentOrdersView = computed<PaymentOrderView[]>(() =>
    this.selectedOrders().map((o) => ({
      publicId: o.publicId,
      orderNumber: o.orderNumber,
      items: o.orderDetails.map((d) => ({
        quantity: d.quantity,
        productName: d.productName,
        subtotal: d.subtotal,
      })),
    }))
  );

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

  onOrderSelected(event: { orderId: string; isSelected: boolean }) {
    this.selectedOrderIds.update((ids) => {
      const newIds = new Set(ids);
      event.isSelected
        ? newIds.add(event.orderId)
        : newIds.delete(event.orderId);
      return newIds;
    });
  }

  confirmPayment() {
    if (!this.hasSelectedOrders()) return;

    // evitar mandar al back órdenes ya pagadas
    const selectableIds = Array.from(this.selectedOrderIds()).filter((id) => {
      const order = this.orders().find((o) => o.publicId === id);
      return (
        !order?.payment || order.payment.status !== PaymentStatus.COMPLETED
      );
    });

    if (selectableIds.length === 0) {
      this.sweetAlertService.showError(
        'Nada para pagar',
        'Las órdenes seleccionadas ya fueron pagadas.'
      );
      this.selectedOrderIds.set(new Set());
      this.payModalCmp?.close();
      return;
    }

    const total = this.totalToPay(); // ya suma solo las seleccionadas
    const paymentMethod = this.selectedPaymentMethod();

    console.log('Enviando Pago: ', paymentMethod, selectableIds);

    this.paymentService
      .createPayment({ paymentMethod, orderIds: selectableIds })
      .subscribe({
        next: (response) => {
          console.log('✅ Pago exitoso:', response);

          this.sweetAlertService.showConfirmableSuccess(
            '¡Pago exitoso!',
            `Pagaste $${total.toFixed(2)}`
          );

          this.payModalCmp?.close();
          // 🔥 refrescar órdenes para que vengan con payment COMPLETED
          this.orderService.reloadMyOrders?.();

          // limpiar selección
          this.selectedOrderIds.set(new Set());
          this.selectedPaymentMethod.set(PaymentMethod.CASH);
        },
        error: (error) => {
          console.error('❌ Error en el pago:', error);
          const errorMessage = this.paymentError() || 'Error desconocido';

          this.payModalCmp?.close(); // que no quede abierto

          this.selectedOrderIds.set(new Set()); // limpio selección para no spamear el back

          this.sweetAlertService.showError(
            'Error al procesar el pago',
            errorMessage
          );
        },
      });
  }
}
