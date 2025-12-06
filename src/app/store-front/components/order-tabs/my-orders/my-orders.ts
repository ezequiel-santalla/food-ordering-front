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
import { OrderCardComponent } from '../Order-card/order-card';
import { PaymentModalComponent } from '../../payment/payment-modal/payment-modal';
import { MercadoPagoCheckout } from '../../mercado-pago/mercado-pago-checkout/mercado-pago-checkout';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    OrderCardComponent,
  ],
  templateUrl: './my-orders.html',
})
export class MyOrders {
  readonly Package = Package;
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;

  private orderService = inject(OrderService);

  @ViewChild('payModalCmp') payModalCmp?: PaymentModalComponent;
  @ViewChild('mpCheckoutCmp') mpCheckoutCmp?: MercadoPagoCheckout;

  orders = this.orderService.myOrders;
  isLoadingOrders = this.orderService.isLoading;
  orderError = this.orderService.error;

}
