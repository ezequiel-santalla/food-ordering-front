import { Component, inject, signal } from '@angular/core';
import { OrderService } from '../../../services/order.service';
import { CurrencyPipe } from '@angular/common';
import { LucideAngularModule, Clock, CircleCheckBig, CircleX, Package } from 'lucide-angular';

@Component({
  selector: 'app-my-orders',
  imports: [CurrencyPipe, LucideAngularModule],
  templateUrl: './my-orders.html',
})
export class MyOrders {

  // constantes de iconos
  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;

  private orderService = inject(OrderService);


  // signals conectadas al servicio
  orders = this.orderService.myOrders;       // ✅ Reactivo
  isLoading = this.orderService.isLoading; // ✅ Reactivo
  error = this.orderService.error;         // ✅ Reactivo

  constructor() {
    }
 
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'PENDING':
        return this.Clock;
      case 'COMPLETED':
        return this.CircleCheckBig;
      case 'CANCELLED':
        return this.CircleX;
      default:
        return this.Package;
    }
  }
}
