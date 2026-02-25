import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-angular';

import { OrderService } from '../../../services/order-service';
import { OrderCardComponent } from '../order-card/order-card';
import { PaymentModalComponent } from '../../payment/payment-modal/payment-modal';
import { MercadoPagoCheckout } from '../../mercado-pago/mercado-pago-checkout/mercado-pago-checkout';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, OrderCardComponent],
  templateUrl: './my-orders.html',
})
export class MyOrders {
  readonly Package = Package;
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;

  private orderService = inject(OrderService);
  private sweetAlert = inject(SweetAlertService);

  @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;
  @ViewChild('mpCheckoutCmp') mpCheckoutCmp?: MercadoPagoCheckout;

  orders = this.orderService.myOrdersView;
  isLoadingOrders = this.orderService.isLoading;
  orderError = this.orderService.error;

  async onCancelOrder(orderId: string) {
    const confirmed = await this.sweetAlert.confirmCustomAction(
      '¿Cancelar orden?',
      '¿Estás seguro que querés cancelar esta orden?',
      'Sí, cancelar',
      'No',
      'warning',
    );

    if (!confirmed) return;

    this.sweetAlert.showLoading('Cancelando...', 'Procesando tu solicitud');

    this.orderService
      .cancelOrder(orderId)
      .pipe(finalize(() => this.sweetAlert.close()))
      .subscribe({
        next: () => {
          this.sweetAlert.showSuccess(
            'Orden cancelada',
            'Se canceló correctamente',
            2000,
          );

          this.orderService.reloadMyOrders();
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            (err?.status === 409
              ? 'No se pudo cancelar (puede haber cambiado el estado).'
              : 'No se pudo cancelar la orden. Intentá nuevamente.');

          this.sweetAlert.showError('Error al cancelar', msg);
        },
      });
  }
}
